/* Pruebas locales de lógica; no sustituyen el envío real en Google Sheets. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const conf = JSON.parse(fs.readFileSync(path.join(root,'configuracion.json'),'utf8'));
const codigo = fs.readFileSync(path.join(root,'apps-script/Code.gs'),'utf8');
let comprobaciones = 0;
function entorno(ahora='2027-05-31T20:00:00Z') {
  const estado = { ahora, http:200, bloqueo:true, alFlush:null, hojas:new Map() };
  class Range {
    constructor(hoja,fila,col,alto=1,ancho=1){Object.assign(this,{hoja,fila,col,alto,ancho});}
    getValues(){return Array.from({length:this.alto},(_,r)=>Array.from({length:this.ancho},(_,c)=>this.hoja.datos[this.fila+r-1]?.[this.col+c-1]??''));}
    setValues(valores){for(let r=0;r<this.alto;r++){this.hoja.datos[this.fila+r-1]??=[];for(let c=0;c<this.ancho;c++)this.hoja.datos[this.fila+r-1][this.col+c-1]=valores[r][c];}return this;}
    setNumberFormat(){return this;}setBackground(){return this;}setFontColor(){return this;}setFontWeight(){return this;}
  }
  class Hoja {
    constructor(){this.datos=[];}
    getLastRow(){return this.datos.length;}getRange(...args){return new Range(this,...args);}
    appendRow(r){this.datos.push(r);return this;}hideSheet(){return this;}setFrozenRows(){return this;}setColumnWidth(){return this;}
  }
  const libro={getSheetByName:n=>estado.hojas.get(n)||null,insertSheet:n=>{const h=new Hoja();estado.hojas.set(n,h);return h;},setSpreadsheetTimeZone:z=>estado.zona=z};
  class Reloj extends Date {constructor(...args){super(...(args.length?args:[estado.ahora]));}static now(){return Date.parse(estado.ahora);}}
  const contexto={Date:Reloj,console,PropertiesService:{getScriptProperties:()=>({getProperty:n=>n==='SHEET_ID'?'hoja-prueba':'https://wifeav.github.io/vanessa-y-emilio/configuracion.json'})},
    UrlFetchApp:{fetch:()=>({getResponseCode:()=>estado.http,getContentText:()=>JSON.stringify(conf)})},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,t)=>Array.from(crypto.createHash('sha256').update(t).digest()),formatDate:(d,z)=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:z}).formatToParts(d).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}},
    SpreadsheetApp:{openById:()=>libro,flush:()=>{if(estado.alFlush)estado.alFlush();}},
    LockService:{getScriptLock:()=>{let obtenido=false;return{tryLock:()=>obtenido=estado.bloqueo,hasLock:()=>obtenido,releaseLock:()=>obtenido=false};}}
  };
  vm.createContext(contexto);vm.runInContext(codigo,contexto);contexto.prepararHojas_();
  return{contexto,estado,filas:()=>estado.hojas.get('Respuestas').datos.slice(1)};
}
const solicitud=(id,extra={})=>({nombre:'Ana',apellidos:'Pérez',telefono:'+593 99 123 4567',asistencia:'Sí',solicitud:id.toString(16).padStart(32,'0'),website:'',...extra});
function probar(titulo,f){f();comprobaciones++;console.log('✓ '+titulo);}
probar('Guarda Sí y conserva las cinco columnas',()=>{const e=entorno();const r=e.contexto.guardarConfirmacion(solicitud(1));assert.equal(r.ok,true);assert.equal(e.filas().length,1);assert.equal(e.filas()[0].length,5);assert.equal(e.filas()[0][4],'Sí');assert.equal(e.estado.zona,'America/Guayaquil');});
probar('Guarda No y personas distintas con teléfono compartido',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));assert.equal(e.contexto.guardarConfirmacion(solicitud(2,{nombre:'Luis',asistencia:'No'})).ok,true);assert.equal(e.filas().length,2);assert.equal(e.filas()[1][4],'No');});
probar('Un reintento del mismo envío no crea otra fila',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,true);assert.equal(e.filas().length,1);});
probar('Duplicados normalizados se rechazan desde otro navegador',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));const r=e.contexto.guardarConfirmacion(solicitud(2,{nombre:'  ANA  ',apellidos:'Perez',telefono:'+593991234567'}));assert.equal(r.codigo,'DUPLICADO');assert.equal(e.filas().length,1);});
probar('No se permite modificar la asistencia con la misma solicitud',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));assert.equal(e.contexto.guardarConfirmacion(solicitud(1,{asistencia:'No'})).codigo,'INVALIDO');assert.equal(e.filas()[0][4],'Sí');});
probar('No se permite modificarla con una solicitud nueva',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));assert.equal(e.contexto.guardarConfirmacion(solicitud(2,{asistencia:'No'})).codigo,'DUPLICADO');assert.equal(e.filas()[0][4],'Sí');});
probar('El 31 de mayo a las 23:59:59 de Ecuador todavía está abierto',()=>{const e=entorno('2027-06-01T04:59:59.999Z');assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,true);});
probar('El 1 de junio a las 00:00 de Ecuador rechaza nuevas filas',()=>{const e=entorno('2027-06-01T05:00:00.000Z');assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).codigo,'CERRADO');assert.equal(e.filas().length,0);});
probar('Un recibo ya guardado se puede confirmar después del plazo sin escribir',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));e.estado.ahora='2027-06-01T05:00:00Z';assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,true);assert.equal(e.filas().length,1);});
probar('Revisa otra vez el plazo inmediatamente antes de escribir',()=>{const e=entorno('2027-06-01T04:59:59Z');e.estado.alFlush=()=>e.estado.ahora='2027-06-01T05:00:00Z';assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).codigo,'CERRADO');assert.equal(e.filas().length,0);});
probar('La fecha que envía el visitante no cambia la restricción',()=>{const e=entorno('2027-06-01T05:00:00Z');assert.equal(e.contexto.guardarConfirmacion(solicitud(1,{fechaLimiteRSVP:'2030-12-31'})).codigo,'CERRADO');});
probar('El teléfono requiere un prefijo internacional válido',()=>{const e=entorno();for(const telefono of ['0991234567','+0 991234567','+35112','+351123456789012345'])assert.equal(e.contexto.guardarConfirmacion(solicitud(1,{telefono})).codigo,'TELEFONO');assert.equal(e.filas().length,0);});
probar('Campos incompletos, estados falsos y trampa anti-spam no escriben',()=>{const e=entorno();for(const extra of [{nombre:''},{apellidos:''},{asistencia:'Tal vez'},{website:'spam'},{solicitud:'falso'}])assert.equal(e.contexto.guardarConfirmacion(solicitud(1,extra)).ok,false);assert.equal(e.filas().length,0);});
probar('Textos que comienzan por fórmula se almacenan como texto',()=>{const e=entorno();assert.equal(e.contexto.guardarConfirmacion(solicitud(1,{nombre:'=IMPORTXML("x")'})).ok,true);assert.ok(e.filas()[0][1].startsWith("'="));assert.ok(e.filas()[0][3].startsWith("'+"));});
probar('La caída de la configuración falla sin aceptar respuestas',()=>{const e=entorno();e.estado.http=503;assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,false);assert.equal(e.filas().length,0);});
probar('Una escritura bloqueada permite reintentar y no afirma éxito',()=>{const e=entorno();e.estado.bloqueo=false;assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).codigo,'ERROR');assert.equal(e.filas().length,0);});
probar('Ordenar las filas no rompe la detección de duplicados',()=>{const e=entorno();e.contexto.guardarConfirmacion(solicitud(1));e.contexto.guardarConfirmacion(solicitud(2,{nombre:'Luis'}));e.estado.hojas.get('Respuestas').datos.splice(1,2,...e.filas().reverse());assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,true);assert.equal(e.contexto.guardarConfirmacion(solicitud(3)).codigo,'DUPLICADO');});
probar('Una tabla con cabeceras alteradas no se sobrescribe',()=>{const e=entorno();e.estado.hojas.get('Respuestas').datos[0][0]='Otro dato';assert.equal(e.contexto.guardarConfirmacion(solicitud(1)).ok,false);assert.equal(e.filas().length,0);});
probar('La fecha de la boda tiene el mismo instante en todos los países',()=>{assert.equal(Date.parse(conf.fechaBoda+'T'+conf.horaInicio+':00-05:00'),Date.parse('2027-07-17T16:30:00Z'));assert.equal(new Date(Date.UTC(2027,6,17)).getUTCDay(),6);});
console.log(`${comprobaciones} comprobaciones de lógica superadas. Pendiente prueba real en Apps Script.`);
