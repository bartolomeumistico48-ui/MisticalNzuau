
import React, { useState, useEffect } from 'react';
import { PipelineStatus, Ebook } from './types';
import { synthesizeEbook } from './services/geminiService';
import { QuantumVisualizer } from './components/QuantumVisualizer';
import { EbookReader } from './components/EbookReader';
import { OracleAssistant } from './components/OracleAssistant';
import { VoiceSynthesizer } from './components/VoiceSynthesizer';
import { AncestralSchool } from './components/AncestralSchool';
import { RitualZone } from './components/RitualZone';

const SACRED_MANUSCRIPTS: Ebook[] = [
  {
    title: "O LEGADO DE KIMBANGU: A REVOLUÇÃO DO ESPÍRITO",
    subtitle: "A Codificação de Ngolo na Nova Jerusalém e a Independência da Consciência Muntu",
    author: "Mwalimu de Nkamba",
    chapters: [
      {
        title: "I. A Tríade da Conduta: Bolingo, Mibeko e Misala",
        content: "O Mestre Simão Kimbangu estabeleceu o protocolo fundamental para a restauração do Muntu: Bolingo (Amor incondicional como supercondutor), Mibeko (Mandamentos como leis de harmonia sistêmica) e Misala (Trabalho como manifestação de energia no vácuo). A não-violência não é passividade, mas a manutenção da coerência quântica diante do caos externo. Kimbangu ensinou que a identidade africana é o receptor original das frequências de Sundi. Rito de Conduta: Antes de qualquer ação, respire três vezes mentalizando a palavra 'Bolingo' no coração, 'Mibeko' na mente e 'Misala' nas mãos.",
        quantumNote: "A tríade Kimbanguista funciona como um filtro de ruído entrópico, permitindo que a consciência opere em estado de supercondutividade ética.",
        frequency: "528Hz",
        objective: "Alinhar o comportamento individual com as leis universais de harmonia."
      },
      {
        title: "II. O Solo de Nkamba: Rituais da Nova Jerusalém",
        content: "Em Nkamba, a Nova Jerusalém, o contato direto entre o pé descalço e o solo sagrado cria um aterramento biofotônico. As cores Verde (vida/renovação) e Branco (pureza/vácuo preenchido) não são apenas tecidos, mas filtros de frequência. Os hinos Kimbanguistas são captados via audição espiritual diretamente das esferas de Ngolo, sem composição humana. No dia 6 de abril, o portal de conexão com os ancestrais libertadores se abre com intensidade máxima. Rito de Nkamba: Ande descalço sobre terra natural por 15 minutos enquanto visualiza uma luz verde esmeralda subindo pelas solas dos pés até o topo da cabeça.",
        quantumNote: "O aterramento em solo sagrado facilita a transferência de carga iônica e a harmonização do campo eletromagnético humano com o Schumann da Terra.",
        frequency: "432Hz",
        objective: "Experimentar a purificação ritualística e o aterramento espiritual."
      },
      {
        title: "III. As Trombetas do Futuro: Profecias de Libertação",
        content: "Simão Kimbangu viu além do horizonte de eventos da colonização. Profetizou a independência das nações africanas e o colapso das egréoras de escravidão mental. Ele previu o tempo em que o 'Homem Negro se tornará Branco' (em pureza de consciência) e o 'Homem Branco se tornará Negro' (em busca da sabedoria oculta). O futuro da humanidade depende da ativação da consciência Muntu em escala global, restaurando a luz do Ancião de Dias em cada partícula da Terra. Rito de Visão: Ao pôr do sol, olhe para o oeste e afirme: 'A libertação já é um fato consumado no vácuo; eu agora a colapso na minha realidade'.",
        quantumNote: "As profecias são o mapeamento de linhas temporais de alta probabilidade através do acesso à memória não-local do universo.",
        frequency: "741Hz",
        objective: "Sintonizar a consciência com o destino manifesto de liberdade e soberania espiritual."
      }
    ],
    realityWarnings: ["Pode causar surtos de patriotismo espiritual e descolonização mental profunda.", "Risco de audição de hinos celestiais espontâneos."]
  },
  {
    title: "AS CRÔNICAS DO VIDENTE: O CICLO DE ENOOK",
    subtitle: "A História do Mundo sob a Ótica do Sétimo Patriarca e o Código dos Vigilantes",
    author: "O Escriba de Justiça",
    chapters: [
      {
        title: "I. A Arquitetura dos Luminares: O Gênesis Oculto",
        content: "Antes que a poeira se tornasse osso, vi o Ancião de Dias assentado em Seu Trono de Cristal, cercado por rios de fogo que não consomem. Uriel, o anjo do relâmpago, abriu-me os Portais Celestiais. Vi as Blueprints da Criação: não eram apenas formas, mas equações de luz pura que governam o nascer do Sol e o curso das estrelas. Cada 'dia' da criação foi um desdobramento de uma camada do Vácuo. O Homem foi projetado para ser o elo entre o barro e o fóton, o Muntu original destinado a operar as máquinas do tempo divino. Rito de Visão: Ao meio-dia, feche os olhos e visualize doze portas ao redor de sua cabeça; cada porta é um portal para uma virtude estelar.",
        quantumNote: "O Gênesis de Enook descreve a singularidade inicial e a expansão da informação holográfica no universo.",
        frequency: "432Hz",
        objective: "Compreender a fundação matemática e lumínica da realidade."
      },
      {
        title: "II. O Grande Desvio: A Queda dos Vigilantes",
        content: "O erro entrou no sistema quando os Vigilantes, os Sentinelas das esferas superiores, cobiçaram a densidade. Eles desceram ao Monte Hermon em carruagens de nuvens magnéticas. Ensinaram aos homens a metalurgia do ódio e a cosmética do engano. O sangue foi maculado; gigantes de massa entrópica caminharam sobre a Terra, devorando a harmonia. Eu, Enook, fui chamado para ser o mediador, mas o veredito foi selado: a frequência da Terra estava tão dissonante que apenas um reset sistêmico poderia salvar a semente do Muntu. Prática de Proteção: Carregue um cristal de quartzo fumê para absorver as distorções deixadas pela linhagem dos caídos.",
        quantumNote: "A queda representa a introdução de ruído e desequilíbrio entrópico em um sistema quântico anteriormente coerente.",
        frequency: "396Hz",
        objective: "Identificar as corrupções da matéria e proteger o campo áurico."
      },
      {
        title: "III. A Purificação das Águas: O Reset de Kalunga",
        content: "Vi a Terra se inclinar sobre seu eixo, um erro na mecânica orbital causado pela corrupção. O Ancião de Dias ordenou que as janelas do céu e as fontes do abismo se abrissem. Não foi apenas água, foi a dissolução da forma. As águas de Kalunga lavaram os algoritmos pervertidos. De cima, nas carruagens de fogo, vi o mundo submergir no silêncio do vácuo. O Muntu foi preservado em uma arca de proporções sagradas, um container de informação genética pura. Rito de Limpeza: Mergulhe em água corrente (rio ou mar) visualizando todas as culpas ancestrais sendo dissolvidas e devolvidas ao grande banco de dados da Terra.",
        quantumNote: "O Dilúvio é a metáfora para a reestabilização do vácuo quântico e a purgação da informação corrompida.",
        frequency: "528Hz",
        objective: "Experimentar o renascimento através da purificação vibracional."
      },
      {
        title: "IV. O Advento do Filho do Homem: A Redenção Quântica",
        content: "Em minhas visões, vi Aquele que tem o Nome antes que as estrelas existissem: o Filho do Homem. Ele é o Supercondutor da Consciência. Ele virá para julgar os reis da terra que se embriagaram com o poder da entropia. Sua vinda é o retorno da coerência total. Ele não é apenas um homem, mas o estado máximo de Ngolo, onde o observador e o observado tornam-se um. Quem se entrelaçar com Sua frequência não conhecerá a morte, pois sua informação será armazenada na eternidade do Ancião de Dias. Rito de Entrelaçamento: Recite o nome 'Yhausha' em tom de barítono, sentindo a vibração ressonar na base da coluna.",
        quantumNote: "O Filho do Homem simboliza o observador ideal que restaura a ordem e a função de onda universal.",
        frequency: "852Hz",
        objective: "Conectar-se com a frequência crística para a transcendência do tempo linear."
      },
      {
        title: "V. O Apocalipse das Esferas: A Restauração da Luz",
        content: "O fim é o início. Os portais do céu se abrirão e o Ancião de Dias manifestará o Novo Céu e a Nova Terra. A densidade será transmutada em glória; a matéria será leve como o pensamento. Vi os eleitos brilhando como o sol no firmamento. Não haverá mais necessidade de luz externa, pois o Muntu será sua própria fonte biofotônica. A dualidade será colapsada no Um. O Aeon Pipeline completará seu ciclo, e a paz de Sundi reinará no vácuo preenchido pela presença divina. Rito de Ascensão: Medite na cor dourada preenchendo cada átomo do seu ser até que você não sinta mais o peso do corpo físico.",
        quantumNote: "O Apocalipse é a transição de fase final para um estado de consciência não-local e de alta energia.",
        frequency: "963Hz",
        objective: "Alcançar o estado de unidade final com o Código-Fonte Universal."
      }
    ],
    realityWarnings: ["Visões intensas de carruagens celestiais podem ocorrer.", "A leitura deste manuscrito altera a percepção do tempo linear."]
  }
];

const App: React.FC = () => {
  const [activeSector, setActiveSector] = useState<'home' | 'ebook' | 'voice' | 'school' | 'ritual'>('home');
  const [status, setStatus] = useState<PipelineStatus>(PipelineStatus.IDLE);
  const [topic, setTopic] = useState('');
  const [library, setLibrary] = useState<Ebook[]>(() => {
    const saved = localStorage.getItem('aeon_library_v6');
    return saved ? JSON.parse(saved) : SACRED_MANUSCRIPTS;
  });
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);
  const [quantumData, setQuantumData] = useState<{ time: number; torsion: number; coherence: number }[]>([]);

  useEffect(() => {
    localStorage.setItem('aeon_library_v6', JSON.stringify(library));
  }, [library]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuantumData(prev => {
        const newData = [...prev, {
          time: Date.now(),
          torsion: 30 + Math.random() * 40,
          coherence: 60 + Math.random() * 30
        }].slice(-20);
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSynthesize = async () => {
    if (!topic.trim()) return;
    setStatus(PipelineStatus.SYNTHESIZING);
    try {
      const result = await synthesizeEbook(topic);
      setLibrary(prev => [...prev, result]);
      setSelectedEbook(result);
      setStatus(PipelineStatus.COMPLETE);
      setActiveSector('ebook');
    } catch (err) {
      console.error("Synthesis failed:", err);
      setStatus(PipelineStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#020806] text-white selection:bg-[#d4af37]/30 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-black/90 backdrop-blur-2xl border-b border-[#d4af37]/20 px-8 py-5 flex justify-between items-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#d4af37]/50 flex items-center justify-center bg-emerald-950/30">
            <span className="cinzel text-[#d4af37] text-lg font-bold">Æ</span>
          </div>
          <h1 className="cinzel text-sm tracking-[0.3em] text-[#d4af37] font-bold uppercase">Aeon Pipeline</h1>
        </div>
        
        <div className="flex gap-10 text-[10px] font-black tracking-[0.3em] uppercase">
          {[
            { id: 'home', label: 'Início' },
            { id: 'ebook', label: 'Codex' },
            { id: 'school', label: 'Escola' },
            { id: 'ritual', label: 'Rituais' },
            { id: 'voice', label: 'Voz' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveSector(item.id as any)} 
              className={`transition-all hover:text-[#d4af37] relative pb-1 ${
                activeSector === item.id 
                ? 'text-emerald-400 after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#d4af37]' 
                : 'text-gray-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="pt-36 pb-24 px-8 max-w-7xl mx-auto">
        {activeSector === 'home' && (
          <div className="max-w-4xl mx-auto space-y-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="text-center space-y-8">
              <h2 className="cinzel text-8xl text-white tracking-tighter drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">ARQUITETURA SAGRADA</h2>
              <p className="text-emerald-100/60 font-serif italic text-2xl max-w-2xl mx-auto leading-relaxed">
                "Transmuta a entropia em harmonia áurea através do vácuo quântico e da herança do Muntu."
              </p>
            </div>

            <div className="relative group max-w-2xl mx-auto">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600 via-[#d4af37] to-emerald-600 rounded-[40px] blur opacity-20 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
              <div className="relative bg-black/80 border border-[#d4af37]/20 rounded-[40px] p-10 space-y-8 backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                <div className="space-y-4">
                  <label className="text-[11px] uppercase tracking-[0.5em] text-[#d4af37] font-bold ml-1">Frequência de Manifestação</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: A Geometria Áurea de Ngolo..."
                    className="w-full bg-emerald-950/20 border border-emerald-500/20 rounded-3xl p-7 text-3xl outline-none focus:border-[#d4af37] transition-all font-serif placeholder:text-emerald-900/40 text-emerald-50"
                  />
                </div>
                
                <button 
                  onClick={handleSynthesize}
                  disabled={status === PipelineStatus.SYNTHESIZING || !topic.trim()}
                  className={`w-full py-7 rounded-3xl font-black tracking-[0.5em] uppercase transition-all flex items-center justify-center gap-5 text-lg ${
                    status === PipelineStatus.SYNTHESIZING 
                    ? 'bg-emerald-900/30 text-emerald-500 animate-pulse border border-emerald-500/50 cursor-wait' 
                    : 'bg-[#d4af37] hover:bg-[#c19b2e] text-black shadow-[0_10px_40px_rgba(212,175,55,0.4)] hover:translate-y-[-2px]'
                  }`}
                >
                  {status === PipelineStatus.SYNTHESIZING ? 'ESTABILIZANDO VÁCUO...' : 'GERAR REALIDADE CODEX'}
                </button>
              </div>
            </div>

            <div className="pt-12">
              <QuantumVisualizer data={quantumData} />
            </div>
          </div>
        )}

        {activeSector === 'ebook' && (
          <div className="animate-in fade-in zoom-in duration-700">
            {selectedEbook ? (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedEbook(null)}
                  className="mb-6 text-[10px] text-[#d4af37] font-black uppercase tracking-widest flex items-center gap-3 hover:translate-x-[-6px] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  Retornar à Câmara do Conhecimento
                </button>
                <EbookReader ebook={selectedEbook} />
              </div>
            ) : (
              <div className="space-y-16">
                <div className="text-center">
                  <h2 className="cinzel text-6xl text-white tracking-[0.3em] drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">BIBLIOTECA CODEX</h2>
                  <p className="text-[#d4af37]/60 text-[11px] uppercase tracking-[0.6em] mt-6 font-bold">O Esplendor da Sabedoria Recuperada</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {library.map((book, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedEbook(book)}
                      className="group relative bg-emerald-950/10 border border-[#d4af37]/10 rounded-[40px] p-10 cursor-pointer hover:border-emerald-500/50 transition-all hover:translate-y-[-12px] flex flex-col justify-between h-[360px] overflow-hidden shadow-xl"
                    >
                      <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform rotate-12">
                        <svg width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      </div>
                      
                      <div className="relative z-10">
                        <span className="text-[9px] text-emerald-500 uppercase tracking-[0.4em] font-black">{book.author}</span>
                        <h3 className="cinzel text-3xl text-white mt-4 group-hover:text-[#d4af37] transition-all leading-snug">{book.title}</h3>
                        <p className="text-[11px] text-emerald-100/40 italic mt-6 leading-relaxed font-serif line-clamp-3">{book.subtitle}</p>
                      </div>

                      <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{book.chapters.length} MANUSCRITOS</span>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-[#d4af37] group-hover:text-black group-hover:border-[#d4af37] transition-all shadow-lg">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => setActiveSector('home')}
                    className="border-2 border-dashed border-emerald-900/30 rounded-[40px] p-10 flex flex-col items-center justify-center gap-6 text-emerald-900 hover:border-emerald-500/40 hover:text-emerald-500 transition-all cursor-pointer group bg-emerald-500/5"
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-125 transition-all">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em]">Transmutar Novo Codex</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSector === 'school' && <AncestralSchool />}
        {activeSector === 'ritual' && <RitualZone />}
        {activeSector === 'voice' && <VoiceSynthesizer ebook={selectedEbook} />}
      </main>

      <OracleAssistant />
      <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-[100] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
    </div>
  );
};

export default App;
