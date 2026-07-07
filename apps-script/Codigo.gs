// ============================================================
// Recebimento - Termas Pacu — Web App (Apps Script)
// Grava cada item numa planilha dedicada (aba CONFERENCIA)
// e salva as fotos no Drive (pasta "Recebimentos - Termas Pacu").
//
// CORRIGIDO (2026-07-07):
//  - Antes usava SpreadsheetApp.getActiveSpreadsheet(), que retorna
//    null neste script (é standalone, sem planilha vinculada).
//    Agora resolve/cria uma planilha fixa por NOME via getPlanilha().
//  - Lê o corpo via e.parameter.payload (FormData enviado pelo app).
//  - Responde com a URL da planilha (campo "planilha") para facilitar
//    localizar onde os dados ficam salvos.
// ============================================================

var PASTA_FOTOS_ID = "";                                  // "" = usa a pasta por nome
var NOME_PASTA_FOTOS = "Recebimentos - Termas Pacu";
var NOME_PLANILHA    = "Recebimentos - Termas Pacu (Dados)";

function pastaFotos() {
  if (PASTA_FOTOS_ID) return DriveApp.getFolderById(PASTA_FOTOS_ID);
  var it = DriveApp.getFoldersByName(NOME_PASTA_FOTOS);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NOME_PASTA_FOTOS);
}

// Resolve (ou cria) a planilha de dados por nome. Usa só DriveApp +
// SpreadsheetApp, escopos que o script já possui — sem re-autorização.
function getPlanilha() {
  var arqs = DriveApp.getFilesByName(NOME_PLANILHA);
  if (arqs.hasNext()) return SpreadsheetApp.open(arqs.next());
  return SpreadsheetApp.create(NOME_PLANILHA);
}

function salvarFoto(b64, nomeArquivo) {
  if (!b64) return "";
  try {
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), "image/jpeg", nomeArquivo + ".jpg");
    var arq = pastaFotos().createFile(blob);
    arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return arq.getUrl();
  } catch (e) { return "ERRO: " + e; }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var data = JSON.parse(e.parameter.payload);
    var ss = getPlanilha();
    var sh = ss.getSheetByName("CONFERENCIA") || ss.insertSheet("CONFERENCIA");
    if (sh.getLastRow() === 0) {
      sh.appendRow(["Data/Hora","Conferente","Setor","Fornecedor","NF","Prazo Negociado",
        "Categoria","Descrição","Lote","Validade","Qtd Pedida","Qtd Entregue","Unidade",
        "Valor","Status","Granel","Material","Modo Medição","Comprimento","Largura","Altura",
        "Volume m³","Observações",
        "Foto A&B Mercadoria","Foto A&B NF",
        "Foto Obra Lateral Dir","Foto Obra Lateral Esq","Foto Obra Monte Areia","Foto Obra Mercadoria"]);
    }

    var c = data.cabecalho || {};
    var carimbo = (c.nf || "s-nf") + "_" + new Date().getTime();
    var f = data.fotos || {};
    var uAbMerc  = salvarFoto(f.abMercadoria,   "AB-Merc_"   + carimbo);
    var uAbNf    = salvarFoto(f.abNf,           "AB-NF_"     + carimbo);
    var uObDir   = salvarFoto(f.obraLateralDir, "OB-LatDir_" + carimbo);
    var uObEsq   = salvarFoto(f.obraLateralEsq, "OB-LatEsq_" + carimbo);
    var uObAreia = salvarFoto(f.obraMonteAreia, "OB-Areia_"  + carimbo);
    var uObMerc  = salvarFoto(f.obraMercadoria, "OB-Merc_"   + carimbo);

    data.linhas.forEach(function(l, idx){
      var p = idx === 0;
      sh.appendRow([l.dataHora,l.conferente,l.setor,l.fornecedor,l.nf,l.prazoNegociado,
        l.categoria,l.descricao,l.lote,l.validade,l.qtdPedida,l.qtdEntregue,l.unidade,
        l.valor,l.status,l.granel,l.material,l.modoMedicao,l.comprimento,l.largura,l.altura,
        l.volumeM3,l.observacoes,
        p?uAbMerc:"", p?uAbNf:"",
        p?uObDir:"", p?uObEsq:"", p?uObAreia:"", p?uObMerc:""]);
    });

    return ContentService.createTextOutput(JSON.stringify({ok:true, planilha: ss.getUrl()}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,erro:String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var url = "";
  try { url = getPlanilha().getUrl(); } catch (ex) { url = "ERRO: " + ex; }
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok", mensagem: "Webhook Termas Pacu ativo. Use POST.", planilha: url
  })).setMimeType(ContentService.MimeType.JSON);
}
