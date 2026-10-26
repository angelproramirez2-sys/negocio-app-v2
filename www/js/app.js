const $=s=>document.querySelector(s);
const DEF={inv:[],orders:[],sup:[],cards:[],sales:[],gym:{},lastNote:''};
function load(){try{return Object.assign({},DEF,JSON.parse(localStorage.getItem('appdata')||'{}'))}catch(e){return Object.assign({},DEF)}}
let S=load();
function save(){try{localStorage.setItem('appdata',JSON.stringify(S))}catch(e){alert('Sin espacio de guardado. Usa fotos más pequeñas o borra algunas.')}}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+(Math.round((n||0)*100)/100).toLocaleString('es-MX');
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
let mode='biz',tab='ped',pedView='pend',weekOff=0,gSel=ymd(new Date()),gMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
const TABS=[['ped','🛍️','Pedidos'],['inv','👕','Inventario'],['gan','📈','Ganancias'],['tar','⭐','Tarjetas'],['prov','🔗','Proveedores']];
const PL={uber:['Uber','img/uber.jpg'],didi:['DiDi','img/didi.jpg'],rappi:['Rappi','']};

/* ---------- avisos / notificaciones ---------- */
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const LN=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.LocalNotifications;
document.body.insertAdjacentHTML('beforeend','<div id="toast" role="status"></div>');
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(tt);tt=setTimeout(()=>t.style.display='none',4000)}
function notify(title,body){
  toast(title+': '+body);
  try{
    if(NATIVE&&LN())LN().schedule({notifications:[{id:Math.floor(Math.random()*2e9),title,body}]}).catch(()=>{});
    else if('Notification' in window&&Notification.permission==='granted')new Notification(title,{body,icon:'icons/icon-192.png'});
  }catch(e){}
}
async function askPerm(){try{if(NATIVE&&LN())await LN().requestPermissions();else if('Notification' in window&&Notification.permission==='default')Notification.requestPermission()}catch(e){}}
document.addEventListener('click',askPerm,{once:true});
if(NATIVE)askPerm();
const nid=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)%2000000000};
function schedEx(day,e){
  if(!NATIVE||!LN()||!e.time||e.done)return;
  const [y,m,d]=day.split('-').map(Number),[hh,mm]=e.time.split(':').map(Number),at=new Date(y,m-1,d,hh,mm);
  if(at<=new Date())return;
  LN().schedule({notifications:[{id:nid(e.id),title:'🏋️ Hora de entrenar',body:e.name,schedule:{at,allowWhileIdle:true}}]}).catch(()=>{});
}
function cancelEx(e){try{if(NATIVE&&LN())LN().cancel({notifications:[{id:nid(e.id)}]}).catch(()=>{})}catch(x){}}
function stockZero(it){if(it&&it.stock<=0)notify('⚠️ Sin stock','#'+it.num+' '+it.name+' se agotó')}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){try{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();return true}catch(x){return false}}}

/* ---------- imagen ---------- */
function img(file){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>{const i=new Image();i.onload=()=>{const sc=Math.min(1,420/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*sc;c.height=i.height*sc;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.65))};i.src=fr.result};fr.readAsDataURL(file)})}
const pic=(src,alt)=>src?`<img class="ph" src="${src}" alt="">`:`<div class="ph">${esc(alt||'Sin foto')}</div>`;

/* ---------- formulario modal ---------- */
function form(title,fields,cb,vals){
  vals=vals||{};
  const m=$('#modal');
  m.innerHTML=`<div class="box"><h2>${esc(title)}</h2>`+fields.map(f=>{
    const v=vals[f.k]!=null?vals[f.k]:'';
    let el;
    if(f.t==='select')el=`<select id="f_${f.k}">${f.o.map(o=>`<option value="${esc(o[0])}" ${o[0]==v?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`;
    else if(f.t==='file')el=`<input id="f_${f.k}" type="file" accept="image/*">`;
    else if(f.t==='area')el=`<textarea id="f_${f.k}" rows="3" placeholder="${esc(f.p||'')}">${esc(v)}</textarea>`;
    else el=`<input id="f_${f.k}" type="${f.t||'text'}" ${f.t==='number'?'inputmode="decimal" step="any"':''} value="${esc(v)}" placeholder="${esc(f.p||'')}">`;
    return `<label for="f_${f.k}">${esc(f.l)}</label>${el}`}).join('')+
    `<div class="row" style="margin-top:16px"><button class="btn grow" id="mc">Cancelar</button><button class="btn fill grow" id="ms">Guardar</button></div></div>`;
  m.style.display='block';
  $('#mc').onclick=()=>m.style.display='none';
  $('#ms').onclick=async()=>{
    const o={};
    for(const f of fields){const e=$('#f_'+f.k);
      if(f.t==='file'){o[f.k]=e.files[0]?await img(e.files[0]):vals[f.k]||''}
      else if(f.t==='number')o[f.k]=parseFloat(e.value)||0;
      else o[f.k]=e.value.trim()}
    for(const f of fields)if(f.req&&!o[f.k]&&o[f.k]!==0){alert('Falta: '+f.l);return}
    if(cb(o)===false)return;
    m.style.display='none';
  };
}

/* ---------- pedidos ---------- */
const platBadge=p=>p?`<span class="plat">🏍️ ${PL[p][1]?`<img src="${PL[p][1]}" alt="${PL[p][0]}">`:''}<b class="${p==='rappi'?'rappi':''}">${PL[p][0]}</b></span>`:'';
function ordCard(o){
  const it=S.inv.find(x=>x.id===o.item),tot=o.total!=null?o.total:o.pay;
  let sug=[];
  if(!o.done&&it){sug=S.inv.filter(x=>x.id!==it.id&&x.stock>0&&x.tipo.toLowerCase()!==it.tipo.toLowerCase());
    if(!sug.length)sug=S.inv.filter(x=>x.id!==it.id&&x.stock>0);sug=sug.slice(0,4)}
  const brk=o.sub!=null?`<div class="mut">Mercancía ${money(o.sub)}${o.disc?' · 🎁 −50% ('+money(-o.discAmt)+')':''}${o.env?' · Envío '+money(o.env):''}</div>`:'';
  const locBtns=o.loc&&!o.done?`<div class="mut" style="margin-top:8px">📍 ${esc(o.loc)}</div><div class="row wrap" style="margin-top:6px">`+
    [['maps','📍 Maps'],['uber','Uber'],['didi','DiDi'],['rappi','Rappi']].map(p=>`<button class="btn sm grow ${o.plat===p[0]?'fill':''}" data-a="go" data-i="${o.id}" data-p="${p[0]}">${PL[p[0]]&&PL[p[0]][1]?`<img class="mini" src="${PL[p[0]][1]}" alt="">`:''}${p[1]}</button>`).join('')+`</div>`:(o.loc?`<div class="mut" style="margin-top:8px">📍 ${esc(o.loc)}</div>`:'');
  return `<div class="card"><div class="row">${pic(it&&it.photo)}<div class="grow">
    <b>${esc(o.client)}</b>${o.cid?' ⭐':''}${platBadge(o.plat)}<div class="mut">${it?'#'+esc(it.num)+' '+esc(it.name):'Prenda eliminada'} × ${o.qty}</div>
    <div class="big">${money(tot)}</div>${brk}<div class="mut">${o.date||''}</div></div></div>${locBtns}
    ${o.done?`<div class="row" style="margin-top:8px"><div class="mut grow">${o.ref?'↩️ Reembolsado':'✅ Entregado · '+(o.doneDate||'')}</div>${o.ref?'':`<button class="btn sm del" data-a="refund" data-i="${o.id}">Reembolsar</button>`}</div>`:
    `<div class="row" style="margin-top:10px"><button class="btn sm fill grow" data-a="sold" data-i="${o.id}">✔ Vendido</button><button class="btn sm del" data-a="delo" data-i="${o.id}">🗑</button></div>
    ${sug.length?`<div class="mut" style="margin-top:10px">💡 Sugerir también:</div><div class="sug">${sug.map(s=>`<div>${pic(s.photo,'#'+s.num)}#${esc(s.num)} ${esc(s.name)}${s.price?'<br>'+money(s.price):''}</div>`).join('')}</div>`:''}`}</div>`;
}
function vPed(){
  const pend=S.orders.filter(o=>!o.done),hist=S.orders.filter(o=>o.done).sort((a,b)=>(b.doneDate||'').localeCompare(a.doneDate||''));
  const seg=`<div class="seg"><button data-a="pv" data-i="pend" class="${pedView==='pend'?'on':''}">Pendientes (${pend.length})</button><button data-a="pv" data-i="hist" class="${pedView==='hist'?'on':''}">Historial (${hist.length})</button></div>`;
  if(pedView==='hist')return seg+(hist.map(ordCard).join('')||'<div class="empty">El historial está vacío.<br>Aquí se guardan los pedidos vendidos.</div>');
  return seg+(pend.map(ordCard).join('')||'<div class="empty">No hay pedidos pendientes.<br>Toca + para agregar uno.</div>');
}
function addPed(){
  const av=S.inv.filter(x=>x.stock>0);
  if(!av.length)return alert('Primero agrega prendas con stock en Inventario.');
  form('Nuevo pedido',[
    {k:'cid',l:'Cliente con tarjeta (opcional)',t:'select',o:[['','— Sin tarjeta —']].concat(S.cards.map(c=>[c.id,c.name+(c.s>=5?' · 🎁 50% de descuento disponible':' · '+c.s+'/5 sellos')]))},
    {k:'client',l:'Nombre del cliente (si no elegiste tarjeta)'},
    {k:'item',l:'Mercancía',t:'select',o:av.map(x=>[x.id,'#'+x.num+' · '+x.name+(x.price?' · '+money(x.price):'')+' ('+x.stock+')'])},
    {k:'qty',l:'Cantidad',t:'number'},
    {k:'over',l:'Precio acordado de la mercancía (opcional; en 0 usa el precio del inventario)',t:'number'},
    {k:'plat',l:'¿Va con moto envío?',t:'select',o:[['','No (entrega o encuentro)'],['uber','Moto envío · Uber'],['didi','Moto envío · DiDi'],['rappi','Moto envío · Rappi']]},
    {k:'env',l:'Costo del envío ($, solo si hay moto envío)',t:'number'},
    {k:'envGan',l:'¿El envío cuenta como ganancia tuya?',t:'select',o:[['0','No (se paga al repartidor)'],['1','Sí']]},
    {k:'loc',l:'Ubicación o punto de encuentro',t:'area',p:'Calle, colonia, ciudad o referencia'}],
  o=>{
    const c=S.cards.find(x=>x.id===o.cid),it=S.inv.find(x=>x.id===o.item),name=c?c.name:o.client;
    if(!name){alert('Falta el nombre del cliente');return false}
    const qty=o.qty||1,sub=o.over>0?o.over:(it.price||0)*qty;
    if(!(sub>0)){alert('Esa prenda no tiene precio. Agrégalo en Inventario o escribe el precio acordado.');return false}
    const disc=!!(c&&c.s>=5),discAmt=disc?sub*.5:0,env=o.plat?o.env:0;
    S.orders.push({id:uid(),client:name,cid:c?c.id:'',item:o.item,qty,sub,disc,discAmt,env,plat:o.plat,envGan:o.envGan==='1',total:sub-discAmt+env,loc:o.loc,done:false,date:ymd(new Date())});
    save();R();
    if(disc)toast('🎁 Se aplicó el 50% de descuento de la tarjeta');
  },{qty:1,envGan:'0'});
}
function sendLoc(o,p){
  const q=encodeURIComponent(o.loc||'');
  if(p==='maps')return window.open('https://www.google.com/maps/search/?api=1&query='+q,'_blank');
  if(p==='uber')return window.open('https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff%5Bformatted_address%5D='+q,'_blank');
  copyText(o.loc||'');
  toast('📋 Dirección copiada. Pégala como destino en '+PL[p][0]);
  setTimeout(()=>window.open(p==='didi'?'https://www.didiglobal.com/mx':'https://www.rappi.com.mx','_blank'),900);
}

/* ---------- inventario ---------- */
function vInv(){
  return `<h2>Inventario (${S.inv.length})</h2>`+(S.inv.map(x=>`<div class="card"><div class="row">${pic(x.photo)}<div class="grow">
    <b>#${esc(x.num)} · ${esc(x.name)}</b><div class="mut">${esc(x.tipo)}</div>
    <div class="big" style="font-size:22px">${x.price?money(x.price):'<span class="mut">Sin precio</span>'}</div>
    <div>${(x.sizes||'').split(',').filter(s=>s.trim()).map(s=>`<span class="tag">${esc(s.trim())}</span>`).join('')}${(x.colors||'').split(',').filter(s=>s.trim()).map(s=>`<span class="tag">🎨 ${esc(s.trim())}</span>`).join('')}${x.stock<=0?'<span class="tag bad">AGOTADO</span>':''}</div></div></div>
    <div class="row" style="margin-top:10px"><button class="btn sm" data-a="stk" data-i="${x.id}" data-d="-1">−</button>
    <b style="min-width:90px;text-align:center;color:${x.stock<=0?'#ff7aa5':'var(--p2)'}">${x.stock} en stock</b>
    <button class="btn sm" data-a="stk" data-i="${x.id}" data-d="1">+</button><span class="grow"></span>
    <button class="btn sm" data-a="edi" data-i="${x.id}">Editar</button><button class="btn sm del" data-a="deli" data-i="${x.id}">🗑</button></div></div>`).join('')||'<div class="empty">Tu inventario está vacío.<br>Toca + para agregar prendas.</div>');
}
function invForm(x){
  x=x||{};
  form(x.id?'Editar prenda':'Nueva prenda',[
    {k:'num',l:'Número de mercancía',req:1,p:'Ej. 101'},{k:'name',l:'Nombre de la prenda',req:1,p:'Ej. Camisa oversize'},
    {k:'tipo',l:'Tipo (camisa, pantalón, gorra…)',req:1},{k:'price',l:'Precio de venta ($)',t:'number'},{k:'sizes',l:'Tallas (separadas por coma)',p:'CH, M, G'},
    {k:'colors',l:'Colores (separados por coma)',p:'Negro, Blanco'},{k:'stock',l:'Piezas en stock',t:'number'},{k:'photo',l:'Foto de la prenda',t:'file'}],
    o=>{const was=x.stock;let item=x;if(x.id)Object.assign(x,o);else{item=Object.assign({id:uid()},o);S.inv.push(item)}
      save();R();if(o.stock<=0&&(was==null||was>0))stockZero(item)},x);
}

/* ---------- ganancias ---------- */
function vGan(){
  const now=new Date(),mon=new Date(now);mon.setHours(0,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7)+weekOff*7);
  const days=[...Array(7)].map((_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);const k=ymd(d);
    return{d,k,v:S.sales.filter(s=>s.d===k).reduce((a,s)=>a+s.amt,0)}});
  const tot=days.reduce((a,x)=>a+x.v,0),max=Math.max(...days.map(x=>x.v),1),all=S.sales.reduce((a,s)=>a+s.amt,0);
  const end=days[6].d;
  return `<h2>Ganancias</h2><div class="card"><div class="row"><button class="btn sm" data-a="wk" data-d="-1">‹</button>
    <div class="grow" style="text-align:center"><div class="mut">${days[0].d.getDate()} ${MESES[days[0].d.getMonth()].slice(0,3)} – ${end.getDate()} ${MESES[end.getMonth()].slice(0,3)}</div>
    <div class="big">${money(tot)}</div></div><button class="btn sm" data-a="wk" data-d="1">›</button></div>
    <div class="bars">${days.map((x,i)=>`<div class="bar"><span>${x.v?money(x.v):''}</span><i style="height:${x.v/max*100*.8}%"></i><span>${DIAS[i]}</span></div>`).join('')}</div></div>
    <div class="card"><div class="mut">Ganancia total acumulada</div><div class="big">${money(all)}</div><div class="mut">${S.sales.length} ventas registradas</div></div>`;
}

/* ---------- tarjetas / proveedores ---------- */
function vTar(){
  return `<h2>Tarjetas de clientes</h2><div class="mut" style="margin-bottom:10px">Cada pedido vendido suma 1 sello. Con 5 sellos, su siguiente pedido lleva 50% de descuento automático.</div>`+(S.cards.map(c=>`<div class="card"><div class="row">${pic(c.photo,'👤')}<div class="grow"><b>${esc(c.name)}</b>
    <div class="mut">Descuentos canjeados: ${c.used||0}</div></div></div>
    <div class="stamps">${[0,1,2,3,4].map(i=>`<div class="st ${i<c.s?'on':''}">${i<c.s?'★':''}</div>`).join('')}</div>
    ${c.s>=5?'<div class="win">🎉 Su próximo pedido lleva 50% de descuento</div>':''}
    <div class="row" style="margin-top:10px">${c.s>=5?`<button class="btn sm grow" data-a="redeem" data-i="${c.id}">Canjear a mano</button>`:`<button class="btn sm fill grow" data-a="stamp" data-i="${c.id}">+ Sello manual</button>`}
    <button class="btn sm del" data-a="delc" data-i="${c.id}">🗑</button></div></div>`).join('')||'<div class="empty">Aún no hay clientes registrados.<br>Toca + para registrar uno.</div>');
}
function vProv(){
  return `<h2>Tiendas de proveedores</h2>`+(S.sup.map(p=>`<div class="card row"><div class="grow"><b>${esc(p.name)}</b><div class="mut" style="word-break:break-all">${esc(p.url)}</div></div>
    <button class="btn sm fill" data-a="open" data-i="${p.id}">Abrir</button><button class="btn sm del" data-a="delp" data-i="${p.id}">🗑</button></div>`).join('')||'<div class="empty">No has guardado proveedores.<br>Toca + para agregar un link.</div>')+
    `<h2 style="margin-top:24px">💾 Respaldo de datos</h2><div class="card"><div class="mut">Copia tu respaldo antes de instalar una versión nueva y restáuralo después.</div>
    <div class="row" style="margin-top:10px"><button class="btn sm grow" data-a="bk">Copiar respaldo</button><button class="btn sm grow" data-a="rs">Restaurar</button></div></div>`;
}

/* ---------- gym ---------- */
const tm={};
const fmt=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function vGym(){
  const y=gMonth.getFullYear(),mo=gMonth.getMonth(),first=(new Date(y,mo,1).getDay()+6)%7,n=new Date(y,mo+1,0).getDate(),hoy=ymd(new Date());
  let cells=DIAS.map(d=>`<span>${d}</span>`).join('')+'<i></i>'.repeat(first);
  for(let d=1;d<=n;d++){const k=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    cells+=`<button data-a="gday" data-i="${k}" class="${k===gSel?'sel':''} ${k===hoy?'hoy':''} ${(S.gym[k]||[]).length?'dot':''}">${d}</button>`}
  const ex=S.gym[gSel]||[],sd=gSel.split('-');
  return `<div class="card"><div class="row"><button class="btn sm" data-a="gm" data-d="-1">‹</button><h2 class="grow" style="text-align:center;margin:0">${MESES[mo]} ${y}</h2><button class="btn sm" data-a="gm" data-d="1">›</button></div>
    <div class="cal" style="margin-top:10px">${cells}</div></div>
    <h2>${+sd[2]} de ${MESES[+sd[1]-1]}</h2>`+(ex.map(e=>{
      const left=tm[e.id]?tm[e.id].left:e.secs;
      return `<div class="card" style="${e.done?'opacity:.55':''}"><div class="row"><b class="grow">${esc(e.name)}${e.time?` <span class="tag">⏰ ${esc(e.time)}</span>`:''}${e.done?' ✅':''}</b><button class="btn sm del" data-a="dele" data-i="${e.id}">🗑</button></div>
      ${e.secs?`<div class="row" style="margin-top:8px"><div class="time grow" id="t_${e.id}">${fmt(left)}</div>
      <button class="btn sm fill" data-a="tgo" data-i="${e.id}" id="tb_${e.id}">${tm[e.id]&&tm[e.id].iv?'Pausa':'Iniciar'}</button><button class="btn sm" data-a="trs" data-i="${e.id}">↺</button></div>`:''}
      <div class="mut" style="margin-top:10px">Repeticiones${e.goal?' (meta '+e.goal+')':''}</div>
      <div class="row" style="justify-content:center"><button class="btn rbtn" data-a="rep" data-i="${e.id}" data-d="-1">−</button><div class="reps" id="r_${e.id}">${e.reps||0}</div><button class="btn fill rbtn" data-a="rep" data-i="${e.id}" data-d="1">+</button></div>
      <div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm" data-a="rrs" data-i="${e.id}">Reiniciar reps</button><button class="btn sm ${e.done?'':'fill'}" data-a="edone" data-i="${e.id}">${e.done?'Marcar pendiente':'✔ Hecho'}</button></div></div>`}).join('')||'<div class="empty">Sin ejercicios este día.<br>Toca + para asignar uno.</div>');
}
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();[0,.25,.5].forEach(t=>{const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.value=.3;o.start(a.currentTime+t);o.stop(a.currentTime+t+.15)})}catch(e){}if(navigator.vibrate)navigator.vibrate([300,150,300])}
function findEx(id){for(const k in S.gym){const e=S.gym[k].find(x=>x.id===id);if(e)return e}}

/* ---------- render ---------- */
function R(){
  const biz=mode==='biz';
  $('#ttl').textContent=biz?'🛍️ Mi Negocio':'🏋️ Mi Gym';
  $('#modeBtn').textContent=biz?'Ir a Gym':'Ir a Negocio';
  $('#nav').style.display=biz?'flex':'none';
  $('#nav').innerHTML=TABS.map(t=>`<button data-a="tab" data-i="${t[0]}" class="${tab===t[0]?'on':''}"><b>${t[1]}</b>${t[2]}</button>`).join('');
  $('#fab').style.display=(biz&&(tab==='gan'||(tab==='ped'&&pedView==='hist')))?'none':'block';
  $('#fab').style.bottom=biz?'calc(env(safe-area-inset-bottom,0px) + 74px)':'22px';
  $('#app').innerHTML=biz?({ped:vPed,inv:vInv,gan:vGan,tar:vTar,prov:vProv}[tab])():vGym();
}

/* ---------- acciones ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const a=b.dataset.a,i=b.dataset.i,d=+b.dataset.d;
  if(a==='mode'){mode=mode==='biz'?'gym':'biz';scrollTo(0,0);return R()}
  if(a==='tab'){tab=i;scrollTo(0,0);return R()}
  if(a==='pv'){pedView=i;return R()}
  if(a==='add')return add();
  if(a==='wk'){weekOff+=d;return R()}
  if(a==='gm'){gMonth=new Date(gMonth.getFullYear(),gMonth.getMonth()+d,1);return R()}
  if(a==='gday'){gSel=i;return R()}
  if(a==='go'){return sendLoc(S.orders.find(x=>x.id===i),b.dataset.p)}
  if(a==='open'){let u=S.sup.find(x=>x.id===i).url;if(!/^https?:\/\//i.test(u))u='https://'+u;window.open(u,'_blank');return}
  if(a==='sold'){
    const o=S.orders.find(x=>x.id===i),it=S.inv.find(x=>x.id===o.item);
    if(it&&it.stock<o.qty&&!confirm('Solo hay '+it.stock+' en inventario. ¿Marcar como vendido igual?'))return;
    const tot=o.total!=null?o.total:o.pay,gain=tot-(o.envGan?0:(o.env||0));
    if(!confirm('¿Marcar pedido de '+o.client+' como vendido?\nSe descuenta del inventario y se suma '+money(gain)+' a tus ganancias.'))return;
    if(it){it.stock=Math.max(0,it.stock-o.qty)}
    S.sales.push({d:ymd(new Date()),amt:gain,o:o.id});o.done=true;o.doneDate=ymd(new Date());
    const c=S.cards.find(x=>x.id===o.cid);
    if(c){if(o.disc){c.s=0;c.used=(c.used||0)+1;o.redeemed=true}else if(c.s<5){c.s++;o.stamped=true;if(c.s>=5)toast('⭐ '+c.name+' completó su tarjeta: su próximo pedido lleva 50%')}}
    save();R();stockZero(it);return}
  if(a==='refund'){
    const o=S.orders.find(x=>x.id===i);
    if(!confirm('¿Reembolsar el pedido de '+o.client+'?\nSe resta de ganancias, regresa la pieza al inventario y se revierte el sello.'))return;
    S.sales=S.sales.filter(s=>s.o!==o.id);
    const it=S.inv.find(x=>x.id===o.item);if(it)it.stock+=o.qty;
    const c=S.cards.find(x=>x.id===o.cid);
    if(c){if(o.redeemed){c.s=5;c.used=Math.max(0,(c.used||0)-1)}else if(o.stamped){c.s=Math.max(0,c.s-1)}}
    o.ref=true;save();toast('↩️ Pedido reembolsado');return R()}
  if(a==='delo'){if(confirm('¿Eliminar este pedido?')){S.orders=S.orders.filter(x=>x.id!==i);save();R()}return}
  if(a==='stk'){const x=S.inv.find(x=>x.id===i),was=x.stock;x.stock=Math.max(0,x.stock+d);save();R();if(was>0)stockZero(x);return}
  if(a==='edi'){return invForm(S.inv.find(x=>x.id===i))}
  if(a==='deli'){if(confirm('¿Eliminar esta prenda?')){S.inv=S.inv.filter(x=>x.id!==i);save();R()}return}
  if(a==='stamp'){const c=S.cards.find(x=>x.id===i);if(c.s<5)c.s++;save();return R()}
  if(a==='redeem'){const c=S.cards.find(x=>x.id===i);if(confirm('¿Canjear el 50% de descuento a mano y reiniciar sellos?')){c.s=0;c.used=(c.used||0)+1;save();R()}return}
  if(a==='delc'){if(confirm('¿Eliminar tarjeta?')){S.cards=S.cards.filter(x=>x.id!==i);save();R()}return}
  if(a==='delp'){S.sup=S.sup.filter(x=>x.id!==i);save();return R()}
  if(a==='bk'){copyText(JSON.stringify(S)).then(ok=>toast(ok?'💾 Respaldo copiado. Pégalo en Notas o mándalo por WhatsApp.':'No se pudo copiar'));return}
  if(a==='rs'){return form('Restaurar respaldo',[{k:'json',l:'Pega aquí tu respaldo',t:'area',req:1}],o=>{
    if(!confirm('Esto reemplaza los datos actuales. ¿Continuar?'))return false;
    try{const dd=JSON.parse(o.json);if(!dd||typeof dd!=='object')throw 0;S=Object.assign({},DEF,dd);save();R();toast('✅ Respaldo restaurado')}catch(x){alert('El respaldo no es válido');return false}})}
  if(a==='dele'){if(confirm('¿Eliminar ejercicio?')){const x=findEx(i);cancelEx(x);clearInterval((tm[i]||{}).iv);delete tm[i];S.gym[gSel]=S.gym[gSel].filter(x=>x.id!==i);if(!S.gym[gSel].length)delete S.gym[gSel];save();R()}return}
  if(a==='edone'){const x=findEx(i);x.done=!x.done;if(x.done)cancelEx(x);else schedEx(gSel,x);save();return R()}
  if(a==='rep'){const x=findEx(i);x.reps=Math.max(0,(x.reps||0)+d);save();$('#r_'+i).textContent=x.reps;if(d>0&&navigator.vibrate)navigator.vibrate(20);return}
  if(a==='rrs'){findEx(i).reps=0;save();return R()}
  if(a==='tgo'){
    const x=findEx(i);let t=tm[i]=tm[i]||{left:x.secs};
    if(t.iv){clearInterval(t.iv);t.iv=null;b.textContent='Iniciar';return}
    if(t.left<=0)t.left=x.secs;
    b.textContent='Pausa';
    t.iv=setInterval(()=>{t.left--;const el=$('#t_'+i);if(el)el.textContent=fmt(t.left);
      if(t.left<=0){clearInterval(t.iv);t.iv=null;beep();const bt=$('#tb_'+i);if(bt)bt.textContent='Iniciar'}},1000);return}
  if(a==='trs'){const x=findEx(i);if(tm[i])clearInterval(tm[i].iv);tm[i]={left:x.secs};return R()}
});
function add(){
  if(mode==='gym'){
    return form('Asignar ejercicio al '+gSel.split('-').reverse().join('/'),[
      {k:'name',l:'Ejercicio',req:1,p:'Ej. Plancha'},{k:'min',l:'Temporizador (minutos, 0 = sin)',t:'number'},{k:'sec',l:'Temporizador (segundos extra)',t:'number'},{k:'goal',l:'Meta de repeticiones (opcional)',t:'number'},{k:'time',l:'Hora del recordatorio',t:'time'}],
      o=>{const e={id:uid(),name:o.name,secs:o.min*60+o.sec,goal:o.goal,reps:0,time:o.time,done:false};(S.gym[gSel]=S.gym[gSel]||[]).push(e);schedEx(gSel,e);save();R()},{time:'08:00'});
  }
  if(tab==='ped')return addPed();
  if(tab==='inv')return invForm();
  if(tab==='tar')return form('Registrar cliente',[{k:'name',l:'Nombre',req:1},{k:'photo',l:'Foto (opcional)',t:'file'}],o=>{S.cards.push({id:uid(),name:o.name,photo:o.photo,s:0,used:0});save();R()});
  if(tab==='prov')return form('Nuevo proveedor',[{k:'name',l:'Nombre de la tienda',req:1},{k:'url',l:'Link',req:1,p:'https://…'}],o=>{S.sup.push(Object.assign({id:uid()},o));save();R()});
}

/* ---------- arranque ---------- */
R();
(function(){
  const t=ymd(new Date()),n=(S.gym[t]||[]).filter(e=>!e.done).length;
  if(n&&S.lastNote!==t){S.lastNote=t;save();setTimeout(()=>notify('🏋️ Gym','Hoy tienes '+n+' ejercicio'+(n>1?'s':'')+' por hacer'),1200)}
  for(const k in S.gym)S.gym[k].forEach(e=>schedEx(k,e));
  const fired={};
  setInterval(()=>{if(NATIVE)return;const now=new Date(),day=ymd(now),hm=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    (S.gym[day]||[]).forEach(e=>{if(!e.done&&e.time===hm&&!fired[e.id+day]){fired[e.id+day]=1;notify('🏋️ Hora de entrenar',e.name)}})},20000);
})();
if("serviceWorker" in navigator&&!NATIVE)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
