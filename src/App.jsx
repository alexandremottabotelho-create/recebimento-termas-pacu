import { useState, useEffect, useRef } from "react";
import {
  Truck, User, Shield, Plus, Trash2, Camera, CheckCircle2, XCircle,
  AlertTriangle, Send, ArrowLeft, LogOut, Package, Ruler, ClipboardList,
  Loader2, ImageIcon, X, CalendarX
} from "lucide-react";

// ============ CONFIGURAÇÃO ============
const URL_WEBAPP =
  "https://script.google.com/macros/s/AKfycbzcE9-n98-LKqrkf0xBet9dvrU-8-qlGpciqoybc6KotokdTo6v6HkkEdx-MzozBA4P/exec";
const PIN_ADMIN = "1234";
const MATERIAIS_GRANEL = ["Lenha", "Areia", "Pedra", "Toco"];
const UNIDADES = ["UN", "KG", "CX", "FD", "PC", "LT", "M³", "SC", "GL"];

// ============ STORAGE (localStorage) ============
function carregarUsuarios() {
  try {
    const r = localStorage.getItem("usuarios");
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
}
function salvarUsuarios(lista) {
  localStorage.setItem("usuarios", JSON.stringify(lista));
}

// ============ UTILITÁRIOS ============
function agora() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function validadeVencida(validade) {
  if (!validade) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const v = new Date(validade + "T00:00:00");
  return v < hoje;
}

function qtdDivergente(item) {
  const p = parseFloat(item.qtdPedida);
  const e = parseFloat(item.qtdEntregue);
  return !isNaN(p) && !isNaN(e) && p !== e;
}

function calcularVolume(g) {
  const n = (x) => parseFloat(String(x).replace(",", ".")) || 0;
  if (g.modoMedicao === "4 Pontos") {
    const largMedia = (n(g.largEsq) + n(g.largDir)) / 2;
    const altMedia = (n(g.alt1) + n(g.alt2) + n(g.alt3) + n(g.alt4)) / 4;
    return { largura: largMedia, altura: altMedia, volume: n(g.comprimento) * largMedia * altMedia };
  }
  return { largura: n(g.largura), altura: n(g.altura), volume: n(g.comprimento) * n(g.largura) * n(g.altura) };
}

// Comprime a foto: máx 1280px, JPEG qualidade 0.7, retorna base64 puro (sem prefixo data:)
function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const escala = MAX / Math.max(width, height);
          width = Math.round(width * escala);
          height = Math.round(height * escala);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ITEM_VAZIO = {
  categoria: "A&B",
  descricao: "",
  lote: "",
  validade: "",
  qtdPedida: "",
  qtdEntregue: "",
  unidade: "UN",
  valor: "",
  status: "OK",
  observacoes: "",
  granel: false,
  material: "Lenha",
  modoMedicao: "Padrão",
  comprimento: "",
  largura: "",
  altura: "",
  largEsq: "",
  largDir: "",
  alt1: "",
  alt2: "",
  alt3: "",
  alt4: "",
};

const FOTOS_AB = [
  { chave: "abMercadoria", rotulo: "Mercadoria" },
  { chave: "abNf", rotulo: "Nota Fiscal" },
];
const FOTOS_OBRA = [
  { chave: "obraLateralDir", rotulo: "Lateral Direita" },
  { chave: "obraLateralEsq", rotulo: "Lateral Esquerda" },
  { chave: "obraMonteAreia", rotulo: "Monte de Areia" },
  { chave: "obraMercadoria", rotulo: "Mercadoria / NF" },
];

// ============ COMPONENTES BASE ============
function Campo({ rotulo, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600 mb-1 block">{rotulo}</span>
      {children}
    </label>
  );
}

const estiloInput =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

function Cabecalho({ titulo, aoVoltar, direita }) {
  return (
    <header className="sticky top-0 z-10 bg-teal-700 text-white shadow-md">
      <div className="flex items-center gap-3 px-4 py-3">
        {aoVoltar && (
          <button onClick={aoVoltar} className="p-1 -ml-1 rounded-lg active:bg-teal-600" aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="text-lg font-semibold flex-1 truncate">{titulo}</h1>
        {direita}
      </div>
    </header>
  );
}

// ============ TELA: LOGIN ============
function TelaLogin({ usuarios, aoEntrar, aoAbrirAdmin }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-700 to-teal-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white">
        <div className="bg-white/10 rounded-full p-5 mb-4">
          <Truck size={48} />
        </div>
        <h1 className="text-2xl font-bold text-center">Validação de Recebimento</h1>
        <p className="text-teal-200 mt-1 mb-8">Termas Pacu — Portaria</p>

        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm text-teal-100 text-center mb-3">Toque no seu nome para entrar:</p>
          {usuarios.length === 0 && (
            <p className="text-center text-teal-200 text-sm bg-white/10 rounded-xl p-4">
              Nenhum usuário cadastrado.
              <br />
              Use o botão Admin abaixo para cadastrar.
            </p>
          )}
          {usuarios.map((u) => (
            <button
              key={u.nome}
              onClick={() => aoEntrar(u)}
              className="w-full flex items-center gap-3 bg-white text-slate-800 rounded-xl px-4 py-3.5 font-medium shadow active:scale-[0.98] transition"
            >
              <span className="bg-teal-100 text-teal-700 rounded-full p-2">
                <User size={18} />
              </span>
              <span className="flex-1 text-left">{u.nome}</span>
              <span className="text-xs text-slate-400">{u.setor}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 flex justify-center">
        <button
          onClick={aoAbrirAdmin}
          className="flex items-center gap-2 text-teal-200 text-sm px-4 py-2 rounded-lg active:bg-white/10"
        >
          <Shield size={16} /> Admin
        </button>
      </div>
    </div>
  );
}

// ============ TELA: ADMIN ============
function TelaAdmin({ usuarios, setUsuarios, aoVoltar }) {
  const [autorizado, setAutorizado] = useState(false);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("Portaria");

  if (!autorizado) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Cabecalho titulo="Acesso Admin" aoVoltar={aoVoltar} />
        <div className="p-6 max-w-sm mx-auto">
          <Campo rotulo="PIN de administrador">
            <input
              type="password"
              inputMode="numeric"
              className={estiloInput + " text-center text-2xl tracking-widest"}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErro("");
              }}
              maxLength={6}
              autoFocus
            />
          </Campo>
          {erro && <p className="text-red-600 text-sm mt-2">{erro}</p>}
          <button
            onClick={() => (pin === PIN_ADMIN ? setAutorizado(true) : setErro("PIN incorreto."))}
            className="w-full mt-4 bg-teal-700 text-white rounded-xl py-3 font-semibold active:bg-teal-800"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const adicionar = () => {
    const n = nome.trim();
    if (!n) return;
    if (usuarios.some((u) => u.nome.toLowerCase() === n.toLowerCase())) return;
    const lista = [...usuarios, { nome: n, setor }];
    setUsuarios(lista);
    salvarUsuarios(lista);
    setNome("");
  };

  const remover = (nomeRemover) => {
    const lista = usuarios.filter((u) => u.nome !== nomeRemover);
    setUsuarios(lista);
    salvarUsuarios(lista);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Cabecalho titulo="Usuários" aoVoltar={aoVoltar} />
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <Campo rotulo="Nome do conferente">
            <input className={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: João Silva" />
          </Campo>
          <Campo rotulo="Setor">
            <select className={estiloInput} value={setor} onChange={(e) => setSetor(e.target.value)}>
              <option>Portaria</option>
              <option>Almoxarifado</option>
              <option>A&B</option>
              <option>Manutenção</option>
            </select>
          </Campo>
          <button
            onClick={adicionar}
            className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white rounded-xl py-3 font-semibold active:bg-teal-800"
          >
            <Plus size={18} /> Adicionar usuário
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow divide-y divide-slate-100">
          {usuarios.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">Nenhum usuário cadastrado.</p>}
          {usuarios.map((u) => (
            <div key={u.nome} className="flex items-center gap-3 px-4 py-3">
              <User size={18} className="text-teal-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-800">{u.nome}</p>
                <p className="text-xs text-slate-400">{u.setor}</p>
              </div>
              <button onClick={() => remover(u.nome)} className="text-red-500 p-2 rounded-lg active:bg-red-50" aria-label={`Remover ${u.nome}`}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ TELA: FORMULÁRIO DE ITEM ============
function TelaItem({ inicial, aoSalvar, aoCancelar }) {
  const [item, setItem] = useState(inicial || ITEM_VAZIO);
  const alt = (campo) => (e) => setItem({ ...item, [campo]: e.target.value });
  const ehObra = item.categoria === "Obra";
  const medicao = calcularVolume(item);
  const vencida = validadeVencida(item.validade);
  const divergente = qtdDivergente(item);

  const salvar = () => {
    if (!item.descricao.trim()) return;
    aoSalvar(item);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      <Cabecalho titulo={inicial ? "Editar Item" : "Novo Item"} aoVoltar={aoCancelar} />
      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Categoria */}
        <div className="grid grid-cols-2 gap-2">
          {["A&B", "Obra"].map((c) => (
            <button
              key={c}
              onClick={() => setItem({ ...item, categoria: c, granel: c === "Obra" ? item.granel : false })}
              className={`rounded-xl py-3 font-semibold border-2 transition ${
                item.categoria === c ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {c === "A&B" ? "🍽 A&B" : "🏗 Obra / Operacional"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <Campo rotulo="Descrição do item *">
            <input className={estiloInput} value={item.descricao} onChange={alt("descricao")} placeholder="Ex.: Filé de tilápia 1kg" />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Lote">
              <input className={estiloInput} value={item.lote} onChange={alt("lote")} />
            </Campo>
            <Campo rotulo="Validade">
              <input type="date" className={estiloInput + (vencida ? " border-red-500 ring-2 ring-red-300" : "")} value={item.validade} onChange={alt("validade")} />
            </Campo>
          </div>
          {vencida && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-sm font-medium">
              <CalendarX size={18} /> Atenção: validade vencida!
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Campo rotulo="Qtd pedida">
              <input type="number" inputMode="decimal" className={estiloInput} value={item.qtdPedida} onChange={alt("qtdPedida")} />
            </Campo>
            <Campo rotulo="Qtd entregue">
              <input
                type="number"
                inputMode="decimal"
                className={estiloInput + (divergente ? " border-amber-500 ring-2 ring-amber-300" : "")}
                value={item.qtdEntregue}
                onChange={alt("qtdEntregue")}
              />
            </Campo>
            <Campo rotulo="Unidade">
              <select className={estiloInput} value={item.unidade} onChange={alt("unidade")}>
                {UNIDADES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Campo>
          </div>
          {divergente && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-sm font-medium">
              <AlertTriangle size={18} /> Quantidade entregue difere da pedida.
            </div>
          )}
          <Campo rotulo="Valor (R$)">
            <input type="number" inputMode="decimal" className={estiloInput} value={item.valor} onChange={alt("valor")} />
          </Campo>
          <Campo rotulo="Observações">
            <textarea className={estiloInput} rows={2} value={item.observacoes} onChange={alt("observacoes")} />
          </Campo>
        </div>

        {/* Status */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "OK", icone: <CheckCircle2 size={18} />, cor: "bg-green-600 border-green-600" },
            { v: "Divergência", icone: <AlertTriangle size={18} />, cor: "bg-amber-500 border-amber-500" },
            { v: "Recusado", icone: <XCircle size={18} />, cor: "bg-red-600 border-red-600" },
          ].map(({ v, icone, cor }) => (
            <button
              key={v}
              onClick={() => setItem({ ...item, status: v })}
              className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-sm font-semibold border-2 transition ${
                item.status === v ? cor + " text-white" : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {icone}
              {v}
            </button>
          ))}
        </div>

        {/* Granel (só Obra) */}
        {ehObra && (
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <button onClick={() => setItem({ ...item, granel: !item.granel })} className="flex items-center gap-2 w-full">
              <span
                className={`w-11 h-6 rounded-full transition relative ${item.granel ? "bg-teal-600" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.granel ? "left-[22px]" : "left-0.5"}`}
                />
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Ruler size={17} /> Material a granel (medição m³)
              </span>
            </button>

            {item.granel && (
              <>
                <Campo rotulo="Material">
                  <select
                    className={estiloInput}
                    value={item.material}
                    onChange={(e) =>
                      setItem({ ...item, material: e.target.value, modoMedicao: e.target.value === "Lenha" ? item.modoMedicao : "Padrão" })
                    }
                  >
                    {MATERIAIS_GRANEL.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </Campo>

                {item.material === "Lenha" && (
                  <div className="grid grid-cols-2 gap-2">
                    {["Padrão", "4 Pontos"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setItem({ ...item, modoMedicao: m })}
                        className={`rounded-xl py-2 text-sm font-semibold border-2 ${
                          item.modoMedicao === m ? "bg-teal-700 text-white border-teal-700" : "bg-white text-slate-500 border-slate-200"
                        }`}
                      >
                        {m === "Padrão" ? "Padrão (C×L×A)" : "4 Pontos (carga irregular)"}
                      </button>
                    ))}
                  </div>
                )}

                <Campo rotulo="Comprimento (m)">
                  <input type="number" inputMode="decimal" className={estiloInput} value={item.comprimento} onChange={alt("comprimento")} />
                </Campo>

                {item.modoMedicao === "4 Pontos" ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Campo rotulo="Largura esq. (m)">
                        <input type="number" inputMode="decimal" className={estiloInput} value={item.largEsq} onChange={alt("largEsq")} />
                      </Campo>
                      <Campo rotulo="Largura dir. (m)">
                        <input type="number" inputMode="decimal" className={estiloInput} value={item.largDir} onChange={alt("largDir")} />
                      </Campo>
                    </div>
                    <span className="text-sm font-medium text-slate-600 block">Altura nos 4 cantos (m)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {["alt1", "alt2", "alt3", "alt4"].map((c, i) => (
                        <input
                          key={c}
                          type="number"
                          inputMode="decimal"
                          placeholder={`C${i + 1}`}
                          className={estiloInput + " px-2 text-center"}
                          value={item[c]}
                          onChange={alt(c)}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Campo rotulo="Largura (m)">
                      <input type="number" inputMode="decimal" className={estiloInput} value={item.largura} onChange={alt("largura")} />
                    </Campo>
                    <Campo rotulo="Altura (m)">
                      <input type="number" inputMode="decimal" className={estiloInput} value={item.altura} onChange={alt("altura")} />
                    </Campo>
                  </div>
                )}

                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-teal-600 font-medium uppercase">Volume calculado</p>
                  <p className="text-2xl font-bold text-teal-800">{medicao.volume.toFixed(3)} m³</p>
                  {item.modoMedicao === "4 Pontos" && (
                    <p className="text-xs text-teal-600 mt-1">
                      Largura média: {medicao.largura.toFixed(2)} m · Altura média: {medicao.altura.toFixed(2)} m
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 flex gap-2 max-w-md mx-auto">
        <button onClick={aoCancelar} className="flex-1 rounded-xl py-3 font-semibold text-slate-600 bg-slate-100 active:bg-slate-200">
          Cancelar
        </button>
        <button
          onClick={salvar}
          disabled={!item.descricao.trim()}
          className="flex-[2] rounded-xl py-3 font-semibold text-white bg-teal-700 active:bg-teal-800 disabled:opacity-40"
        >
          Salvar item
        </button>
      </div>
    </div>
  );
}

// ============ COMPONENTE: CAPTURA DE FOTO ============
function BotaoFoto({ rotulo, base64, aoCapturar, aoRemover }) {
  const ref = useRef(null);
  const [processando, setProcessando] = useState(false);

  const aoSelecionar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setProcessando(true);
    try {
      const b64 = await comprimirFoto(file);
      aoCapturar(b64);
    } catch {
      alert("Não foi possível processar a foto. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="relative">
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={aoSelecionar} />
      <button
        onClick={() => ref.current?.click()}
        className={`w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 overflow-hidden transition ${
          base64 ? "border-teal-500" : "border-dashed border-slate-300 bg-white active:bg-slate-50"
        }`}
      >
        {processando ? (
          <Loader2 size={26} className="animate-spin text-teal-600" />
        ) : base64 ? (
          <img src={`data:image/jpeg;base64,${base64}`} alt={rotulo} className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={26} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 px-2 text-center leading-tight">{rotulo}</span>
          </>
        )}
      </button>
      {base64 && (
        <>
          <span className="absolute bottom-1 inset-x-1 bg-black/60 text-white text-[10px] font-medium rounded-lg px-1.5 py-0.5 text-center truncate">
            {rotulo}
          </span>
          <button
            onClick={aoRemover}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow"
            aria-label={`Remover foto ${rotulo}`}
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}

// ============ TELA: CONFERÊNCIA ============
function TelaConferencia({ usuario, aoSair }) {
  const [cabecalho, setCabecalho] = useState({ fornecedor: "", nf: "", prazoNegociado: "" });
  const [itens, setItens] = useState([]);
  const [fotos, setFotos] = useState({});
  const [editando, setEditando] = useState(null); // null | -1 (novo) | índice
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // {ok, mensagem}

  const temAB = itens.some((i) => i.categoria === "A&B");
  const temObra = itens.some((i) => i.categoria === "Obra");
  const slotsFotos = [...(temAB ? FOTOS_AB : []), ...(temObra ? FOTOS_OBRA : [])];
  const podeEnviar = cabecalho.fornecedor.trim() && cabecalho.nf.trim() && itens.length > 0 && !enviando;

  const alt = (campo) => (e) => setCabecalho({ ...cabecalho, [campo]: e.target.value });

  const enviar = async () => {
    setEnviando(true);
    setResultado(null);
    const dataHora = agora();
    const linhas = itens.map((it) => {
      const m = it.granel ? calcularVolume(it) : null;
      return {
        dataHora,
        conferente: usuario.nome,
        setor: usuario.setor || "Portaria",
        fornecedor: cabecalho.fornecedor,
        nf: cabecalho.nf,
        prazoNegociado: cabecalho.prazoNegociado,
        categoria: it.categoria,
        descricao: it.descricao,
        lote: it.lote,
        validade: it.validade,
        qtdPedida: it.qtdPedida,
        qtdEntregue: it.qtdEntregue,
        unidade: it.unidade,
        valor: it.valor,
        status: it.status,
        granel: it.granel ? "Sim" : "Não",
        material: it.granel ? it.material : "",
        modoMedicao: it.granel ? it.modoMedicao : "",
        comprimento: it.granel ? it.comprimento : "",
        largura: it.granel ? m.largura.toFixed(2) : "",
        altura: it.granel ? m.altura.toFixed(2) : "",
        volumeM3: it.granel ? m.volume.toFixed(3) : "",
        observacoes: it.observacoes,
      };
    });

    const payload = {
      tipo: "CONFERENCIA",
      cabecalho: { dataHora, conferente: usuario.nome, fornecedor: cabecalho.fornecedor, nf: cabecalho.nf },
      linhas,
      fotos,
    };

    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      const resp = await fetch(URL_WEBAPP, { method: "POST", body: fd });
      const json = await resp.json();
      if (json.ok) {
        setResultado({ ok: true, mensagem: "Conferência enviada com sucesso!" });
        setCabecalho({ fornecedor: "", nf: "", prazoNegociado: "" });
        setItens([]);
        setFotos({});
      } else {
        setResultado({ ok: false, mensagem: "Erro no servidor: " + (json.erro || "desconhecido") });
      }
    } catch (e) {
      setResultado({ ok: false, mensagem: "Falha no envio: " + e.message + ". Verifique a internet e tente de novo." });
    } finally {
      setEnviando(false);
    }
  };

  if (editando !== null) {
    return (
      <TelaItem
        inicial={editando >= 0 ? itens[editando] : null}
        aoCancelar={() => setEditando(null)}
        aoSalvar={(item) => {
          setItens(editando >= 0 ? itens.map((x, i) => (i === editando ? item : x)) : [...itens, item]);
          setEditando(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-32">
      <Cabecalho
        titulo="Nova Conferência"
        direita={
          <button onClick={aoSair} className="flex items-center gap-1.5 text-sm text-teal-100 px-2 py-1 rounded-lg active:bg-teal-600">
            <LogOut size={16} /> Sair
          </button>
        }
      />
      <div className="p-4 max-w-md mx-auto space-y-4">
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          <User size={15} /> Conferente: <b className="text-slate-700">{usuario.nome}</b>
        </p>

        {/* Cabeçalho da NF */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <ClipboardList size={18} className="text-teal-600" /> Dados da Nota Fiscal
          </h2>
          <Campo rotulo="Fornecedor *">
            <input className={estiloInput} value={cabecalho.fornecedor} onChange={alt("fornecedor")} placeholder="Nome do fornecedor" />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Nº da NF *">
              <input className={estiloInput} value={cabecalho.nf} onChange={alt("nf")} inputMode="numeric" />
            </Campo>
            <Campo rotulo="Prazo negociado">
              <input className={estiloInput} value={cabecalho.prazoNegociado} onChange={alt("prazoNegociado")} placeholder="Ex.: 28 dias" />
            </Campo>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Package size={18} className="text-teal-600" /> Itens ({itens.length})
            </h2>
            <button
              onClick={() => setEditando(-1)}
              className="flex items-center gap-1 bg-teal-700 text-white text-sm font-semibold rounded-lg px-3 py-1.5 active:bg-teal-800"
            >
              <Plus size={16} /> Item
            </button>
          </div>

          {itens.length === 0 && <p className="text-sm text-slate-400 text-center py-3">Nenhum item adicionado ainda.</p>}

          {itens.map((it, i) => {
            const vencida = validadeVencida(it.validade);
            const diverge = qtdDivergente(it);
            return (
              <div
                key={i}
                className={`rounded-xl border p-3 ${vencida ? "border-red-300 bg-red-50" : "border-slate-200"}`}
              >
                <div className="flex items-start gap-2">
                  <button onClick={() => setEditando(i)} className="flex-1 text-left">
                    <p className="font-medium text-slate-800">{it.descricao}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {it.categoria} · {it.qtdEntregue || "?"} {it.unidade}
                      {it.granel ? ` · ${it.material} ${calcularVolume(it).volume.toFixed(2)} m³` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          it.status === "OK"
                            ? "bg-green-100 text-green-700"
                            : it.status === "Divergência"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {it.status}
                      </span>
                      {vencida && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                          <CalendarX size={11} /> VENCIDO
                        </span>
                      )}
                      {diverge && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                          <AlertTriangle size={11} /> QTD ≠
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setItens(itens.filter((_, j) => j !== i))}
                    className="text-red-400 p-1.5 rounded-lg active:bg-red-50"
                    aria-label={`Remover ${it.descricao}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fotos */}
        {slotsFotos.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <ImageIcon size={18} className="text-teal-600" /> Fotos de evidência
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {slotsFotos.map(({ chave, rotulo }) => (
                <BotaoFoto
                  key={chave}
                  rotulo={rotulo}
                  base64={fotos[chave]}
                  aoCapturar={(b64) => setFotos((f) => ({ ...f, [chave]: b64 }))}
                  aoRemover={() => setFotos((f) => ({ ...f, [chave]: undefined }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Resultado do envio */}
        {resultado && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
              resultado.ok ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {resultado.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {resultado.mensagem}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3">
        <div className="max-w-md mx-auto">
          <button
            onClick={enviar}
            disabled={!podeEnviar}
            className="w-full flex items-center justify-center gap-2 bg-teal-700 text-white rounded-xl py-3.5 font-bold text-base active:bg-teal-800 disabled:opacity-40"
          >
            {enviando ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Send size={20} /> Enviar conferência
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ APP ============
export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [tela, setTela] = useState("login"); // login | admin | conferencia

  useEffect(() => {
    setUsuarios(carregarUsuarios());
  }, []);

  if (tela === "admin") {
    return <TelaAdmin usuarios={usuarios} setUsuarios={setUsuarios} aoVoltar={() => setTela("login")} />;
  }

  if (tela === "conferencia" && usuario) {
    return (
      <TelaConferencia
        usuario={usuario}
        aoSair={() => {
          setUsuario(null);
          setTela("login");
        }}
      />
    );
  }

  return (
    <TelaLogin
      usuarios={usuarios}
      aoEntrar={(u) => {
        setUsuario(u);
        setTela("conferencia");
      }}
      aoAbrirAdmin={() => setTela("admin")}
    />
  );
}
