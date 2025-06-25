const sock=io();
let data;
sock.on('update', d => {
  data = d;
  render();
});
sock.on('sms', ({deviceId,sms})=>{
  // Optionally show sms log
  alert(`SMS to ${deviceId}: ${sms.message}`);
});

function render(){
  const dv=document.getElementById('devices'),
        sel=document.getElementById('selDev');
  dv.innerHTML=''; sel.innerHTML='';
  Object.entries(data.devices).forEach(([id,d])=>{
    const div=document.createElement('div');
    div.textContent = `${id} - ${d.name} [v${d.version}] status:${d.status}`;
    const btn=document.createElement('button');
    btn.textContent='Remove';
    btn.onclick=()=>removeDevice(id);
    div.appendChild(btn);
    dv.appendChild(div);
    const opt=document.createElement('option');
    opt.value=id; opt.textContent=id;
    sel.appendChild(opt);
  });
}
function addDevice(){
  fetch('/api/device',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
    id:document.getElementById('d_id').value,
    name:document.getElementById('d_name').value,
    version:document.getElementById('d_ver').value
  })});
}
function removeDevice(id){
  fetch(`/api/device/${id}`,{method:'DELETE'});
}
function sendSMS(){
  fetch('/api/sms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    deviceId:document.getElementById('selDev').value,
    message:document.getElementById('sms_in').value
  })});
}
