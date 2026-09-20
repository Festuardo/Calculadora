'use strict';
const $=id=>document.getElementById(id);
const formatCurrency=v=>new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(v);
function calculateQuote(amount,term,rate,type){
 if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(term)||term<1||term>1200||!Number.isFinite(rate)||rate<0||!['nivelada','saldo'].includes(type))throw new Error('Revisa el monto, el plazo entero (1 a 1200 meses) y la tasa anual.');
 const monthlyRate=rate/1200,fixed=monthlyRate===0?amount/term:amount*monthlyRate/(-Math.expm1(-term*Math.log1p(monthlyRate)));
 let balance=amount,totalInterest=0;const rows=[];
 for(let month=1;month<=term;month++){
  const interest=balance*monthlyRate;let principal=type==='nivelada'?fixed-interest:amount/term;
  if(month===term)principal=balance;
  const installment=principal+interest;balance=Math.max(0,balance-principal);totalInterest+=interest;
  if(!Number.isFinite(installment)||!Number.isFinite(totalInterest))throw new Error('Los valores ingresados exceden el rango de cálculo.');
  rows.push({month,interest,principal,installment,balance});
 }
 return {amount,term,rate,type,rows,totalInterest,total:amount+totalInterest};
}
function quoteMessage(q){return `*Cotización de crédito*\n\nMonto: ${formatCurrency(q.amount)}\nPlazo: ${q.term} meses\nTasa de interés: ${q.rate}% anual\nTipo: ${q.type==='nivelada'?'Cuotas niveladas':'Cuotas sobre saldo'}\n${q.type==='nivelada'?`Cuota mensual: ${formatCurrency(q.rows[0].installment)}`:`Primera cuota: ${formatCurrency(q.rows[0].installment)}\nÚltima cuota: ${formatCurrency(q.rows.at(-1).installment)}`}\nIntereses totales: ${formatCurrency(q.totalInterest)}\nTotal a pagar: ${formatCurrency(q.total)}`;}
let currentQuote=null;
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function invalidate(){currentQuote=null;$('share').disabled=true;$('print').disabled=true;$('shareFallback').hidden=true;$('table-container').hidden=true;$('empty').hidden=false;status('Genera la cotización con los datos actualizados.');}
$('quoteForm').addEventListener('input',invalidate);
$('quoteForm').addEventListener('change',invalidate);
$('quoteForm').addEventListener('submit',e=>{e.preventDefault();try{
 const q=calculateQuote(Number($('amount').value.replaceAll(',','')),Number($('term').value),Number($('rate').value),$('type').value);currentQuote=q;
 const metric=(label,value)=>`<div class="metric"><span>${label}</span><strong>${formatCurrency(value)}</strong></div>`;
 $('table-container').innerHTML=`<h2>Tu cotización</h2><p class="quote-meta">Monto: ${formatCurrency(q.amount)} · Plazo: ${q.term} meses · Tasa anual: ${q.rate}%<br>${q.type==='nivelada'?'Cuotas niveladas':'Cuotas sobre saldo'} · Fecha: ${new Date().toLocaleDateString('es-GT')}</p><div class="summary">${metric(q.type==='nivelada'?'Cuota mensual':'Primera cuota',q.rows[0].installment)}${metric('Intereses totales',q.totalInterest)}${metric('Total a pagar',q.total)}</div><div class="table-scroll"><table><thead><tr><th scope="col">Mes</th><th scope="col">Cuota</th><th scope="col">Interés</th><th scope="col">Capital</th><th scope="col">Saldo</th></tr></thead><tbody>${q.rows.map(r=>`<tr><td data-label="Mes">${r.month}</td><td data-label="Cuota">${formatCurrency(r.installment)}</td><td data-label="Interés">${formatCurrency(r.interest)}</td><td data-label="Capital">${formatCurrency(r.principal)}</td><td data-label="Saldo">${formatCurrency(r.balance)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td data-label="Cuotas">${formatCurrency(q.total)}</td><td data-label="Interés">${formatCurrency(q.totalInterest)}</td><td data-label="Capital">${formatCurrency(q.amount)}</td><td data-label="Saldo">${formatCurrency(0)}</td></tr></tfoot></table></div><p class="note">Estimación de capital e intereses. No incluye seguros, comisiones ni otros cargos. Sujeta a las condiciones del crédito. Las cifras mostradas se redondean a dos decimales.</p><p class="print-footer">© ${new Date().getFullYear()} Fgarcia · Todos los derechos reservados.</p>`;
 $('table-container').hidden=false;$('empty').hidden=true;$('share').disabled=false;$('print').disabled=false;$('shareFallback').hidden=true;status('Cotización lista para compartir o imprimir.');
 }catch(err){invalidate();status(err.message,true);}});
$('print').onclick=()=>{if(currentQuote)window.print();};
$('share').onclick=()=>{if(!currentQuote)return;const text=encodeURIComponent(quoteMessage(currentQuote));$('webShare').href='https://web.whatsapp.com/send?text='+text;$('shareFallback').hidden=false;status('Se solicitó abrir WhatsApp. Selecciona el contacto y revisa la cotización antes de enviarla.');window.location.href='whatsapp://send?text='+text;};
$('year').textContent=new Date().getFullYear();
let installPrompt=null,installed=false;const standalone=window.matchMedia('(display-mode: standalone)');
function updateInstall(){ $('install').hidden=installed||standalone.matches||window.navigator.standalone===true; }
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;updateInstall();});
window.addEventListener('appinstalled',()=>{installed=true;installPrompt=null;updateInstall();});
standalone.addEventListener('change',updateInstall);updateInstall();
$('install').onclick=async()=>{if(installPrompt){const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted'){installed=true;updateInstall();}}catch{showInstallHelp();}}else showInstallHelp();};
function showInstallHelp(){const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);$('installText').textContent=ios?'En Safari, toca Compartir y luego Agregar a pantalla de inicio. Activa Abrir como app si aparece y confirma con Agregar.':'En Chrome o Edge, abre el menú del navegador y busca Instalar aplicación o Instalar esta página como aplicación. Si acabas de abrir el sitio, espera unos segundos y vuelve a intentarlo.';$('installHelp').showModal();}
$('closeHelp').onclick=()=>$('installHelp').close();
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>status('No se pudo preparar el acceso sin conexión. Puedes seguir cotizando y volver a abrir la página con internet.')));

function formatAmountEntry(value){
 const clean=value.replace(/[^0-9.]/g,''),dot=clean.indexOf('.');
 let integer=(dot<0?clean:clean.slice(0,dot)).replace(/^0+(?=\d)/,'');
 const decimal=dot<0?'':clean.slice(dot+1).replaceAll('.','').slice(0,2);
 if(!clean)return '';
 if(!integer)integer='0';
 return integer.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(dot<0?'':'.'+decimal);
}
$('amount').addEventListener('input',()=>{
 const input=$('amount'),old=input.value,position=input.selectionStart??old.length;
 const meaningful=old.slice(0,position).replace(/,/g,'').length;
 input.value=formatAmountEntry(old);
 let cursor=0,count=0;
 while(cursor<input.value.length&&count<meaningful){if(input.value[cursor]!==',')count++;cursor++;}
 input.setSelectionRange(cursor,cursor);
});
$('amount').addEventListener('blur',()=>{
 const input=$('amount'),clean=input.value.replaceAll(',','');
 if(clean&&Number.isFinite(Number(clean)))input.value=Number(clean).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
});
