// ─── Programas de treino por local ────────────────────────────────────────────

export const GYM_TYPES = [
  { id:'full',      label:'Academia Completa',  icon:'🏋️', desc:'Todos os equipamentos: barras, máquinas, cabos, halteres' },
  { id:'basic',     label:'Academia Básica',    icon:'💪', desc:'Halteres, barra, banco e alguns equipamentos' },
  { id:'home',      label:'Em Casa',            icon:'🏠', desc:'Sem equipamento ou com halteres leves / elásticos' },
  { id:'outdoor',   label:'Ao Ar Livre',        icon:'🌳', desc:'Parque, barras de rua, calistenia' },
  { id:'crossfit',  label:'CrossFit / Funcional',icon:'⚡', desc:'WODs, movimentos olímpicos, alta intensidade' },
]

export const PROGRAMS = {

  // ════════════════════════════════════════════════════════════════
  // ACADEMIA COMPLETA
  // ════════════════════════════════════════════════════════════════

  upperLower5: {
    name: 'Upper / Lower 5x',
    gymType: 'full',
    description: 'Split de 5 dias com alternância push/pull e foco em cadeia posterior',
    frequency: '5 dias/semana',
    level: 'Intermediário',
    days: [
      {
        id:1, name:'Upper A', focus:'Peito Superior & Costas', tag:'UPPER A', color:'#dc2626',
        rationale:'Alternância entre empurrar e puxar para otimizar a recuperação local.',
        exercises:[
          { name:'Supino Inclinado', sets:'4', reps:'8–10', rest:'2–3 min', rir:'RIR 2', muscle:'Peitoral superior', note:'Controle a descida por 3s.', equipment:'Barra' },
          { name:'Barra Fixa', sets:'4', reps:'Máx / 6–10', rest:'2 min', rir:'RIR 1', muscle:'Dorsais (largura)', note:'Pronada ou supinada.', equipment:'Barra fixa' },
          { name:'Crucifixo Polia', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Peitoral (isolamento)', note:'Tensão contínua, não trave no topo.', equipment:'Polia' },
          { name:'Remada Curvada', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Dorsais (espessura)', note:'Cotovelo colado ao corpo.', equipment:'Barra' },
          { name:'Facepull', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Puxar em direção ao rosto com rotação externa.', equipment:'Polia' },
          { name:'Rosca Direta', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Bíceps', note:'Sem balanço de tronco.', equipment:'Barra' },
          { name:'Tríceps Polia', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Cotovelo fixo ao lado do corpo.', equipment:'Polia' },
        ]
      },
      {
        id:2, name:'Lower A', focus:'Quad & Glúteo', tag:'LOWER A', color:'#94a3b8',
        rationale:'Foco em quadríceps e glúteo com agachamento como exercício central.',
        exercises:[
          { name:'Agachamento Livre', sets:'4', reps:'6–8', rest:'3–4 min', rir:'RIR 2', muscle:'Quadríceps, glúteo', note:'Paralelo ou abaixo do paralelo. Joelho no sentido do pé.', equipment:'Barra' },
          { name:'Leg Press 45°', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Quadríceps, glúteo', note:'Pés na largura do ombro, não trave os joelhos.', equipment:'Máquina' },
          { name:'Cadeira Extensora', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Quadríceps (isolamento)', note:'Contração isométrica no topo por 1s.', equipment:'Máquina' },
          { name:'Afundo com Barra', sets:'3', reps:'10/perna', rest:'90s', rir:'RIR 2', muscle:'Glúteo, quad', note:'Passo largo, joelho não ultrapassa o pé.', equipment:'Barra' },
          { name:'Panturrilha Sentada', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Sóleo', note:'Amplitude completa, pausa no estiramento.', equipment:'Máquina' },
        ]
      },
      {
        id:3, name:'Upper B', focus:'Ombro & Braços', tag:'UPPER B', color:'#dc2626',
        rationale:'Desenvolvimento de ombros e isolamento de braços.',
        exercises:[
          { name:'Desenvolvimento Militar', sets:'4', reps:'8–10', rest:'2–3 min', rir:'RIR 2', muscle:'Deltóide frontal/lateral', note:'Core contraído, sem hiperextensão lombar.', equipment:'Barra' },
          { name:'Elevação Lateral', sets:'4', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Leve inclinação à frente, polegar levemente para baixo.', equipment:'Halter' },
          { name:'Puxada Fechada', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Dorsais', note:'Supinada, cotovelo em 45°.', equipment:'Polia' },
          { name:'Crucifixo Invertido', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Inclinado para frente, movimento controlado.', equipment:'Halter' },
          { name:'Rosca Martelo', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Bíceps braquial', note:'Pegada neutra.', equipment:'Halter' },
          { name:'Tríceps Francês', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Tríceps (porção longa)', note:'Cotovelos apontados para o teto.', equipment:'Halter' },
        ]
      },
      {
        id:4, name:'Lower B', focus:'Posterior & Lombar', tag:'LOWER B', color:'#94a3b8',
        rationale:'Foco em isquiotibiais e cadeia posterior com terra como exercício central.',
        exercises:[
          { name:'Terra Romeno', sets:'4', reps:'8–10', rest:'3 min', rir:'RIR 2', muscle:'Isquiotibiais, glúteo', note:'Barra roça a perna. Neutro na coluna, não arredonde.', equipment:'Barra' },
          { name:'Mesa Flexora', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Isquiotibiais (isolamento)', note:'Contração completa, descida lenta por 3s.', equipment:'Máquina' },
          { name:'Hip Thrust', sets:'4', reps:'10–12', rest:'90s', rir:'RIR 1', muscle:'Glúteo máximo', note:'Pausa de 2s na contração máxima.', equipment:'Barra' },
          { name:'Cadeira Abdutora', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Glúteo médio', note:'Pés paralelos, sem apoiar no banco.', equipment:'Máquina' },
          { name:'Panturrilha em Pé', sets:'4', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Gastrocnêmio', note:'Amplitude máxima, pausa no estiramento.', equipment:'Máquina' },
        ]
      },
      {
        id:5, name:'Upper C', focus:'Peito Baixo & Pull', tag:'UPPER C', color:'#dc2626',
        rationale:'Completar volume de peito e costas da semana.',
        exercises:[
          { name:'Supino Reto', sets:'4', reps:'8–10', rest:'3 min', rir:'RIR 2', muscle:'Peitoral (geral)', note:'Barra desce até tocar o peito. Arco natural na lombar.', equipment:'Barra' },
          { name:'Remada com Halter', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Dorsais, bíceps', note:'Um braço de cada vez. Rotação leve do tronco.', equipment:'Halter' },
          { name:'Crossover', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Peitoral inferior', note:'Polia alta, adução com leve flexão de cotovelo.', equipment:'Polia' },
          { name:'Pullover', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Dorsais, peitoral', note:'Cotovelo levemente dobrado durante todo o movimento.', equipment:'Halter' },
          { name:'Elevação Frontal', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Deltóide frontal', note:'Alterne os braços ou faça simultâneo.', equipment:'Halter' },
        ]
      },
    ]
  },

  ppl6: {
    name: 'Push Pull Legs 6x',
    gymType: 'full',
    description: 'Split clássico de 6 dias dividido em empurrar, puxar e pernas',
    frequency: '6 dias/semana',
    level: 'Avançado',
    days: [
      {
        id:1, name:'Push A', focus:'Peito & Ombro', tag:'PUSH A', color:'#dc2626',
        rationale:'Volume em peito e deltóide anterior.',
        exercises:[
          { name:'Supino Reto', sets:'4', reps:'6–8', rest:'3 min', rir:'RIR 2', muscle:'Peitoral', note:'Movimento principal da sessão.', equipment:'Barra' },
          { name:'Supino Inclinado Halter', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Peitoral superior', note:'Amplitude máxima, controle total.', equipment:'Halter' },
          { name:'Desenvolvimento Militar', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Deltóide', note:'Sem balanço lombar.', equipment:'Barra' },
          { name:'Elevação Lateral', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Peso leve, alto volume.', equipment:'Halter' },
          { name:'Crossover', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Peitoral (isolamento)', note:'Squeeze no topo.', equipment:'Polia' },
          { name:'Tríceps Polia', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Supinação no final.', equipment:'Polia' },
        ]
      },
      {
        id:2, name:'Pull A', focus:'Costas & Bíceps', tag:'PULL A', color:'#94a3b8',
        rationale:'Volume em dorsais, romboides e bíceps.',
        exercises:[
          { name:'Barra Fixa', sets:'4', reps:'6–10', rest:'3 min', rir:'RIR 2', muscle:'Dorsais', note:'Peso adicional se necessário.', equipment:'Barra fixa' },
          { name:'Remada Curvada', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Espessura das costas', note:'Pegar pronado.', equipment:'Barra' },
          { name:'Puxada Polia Alta', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Dorsais', note:'Puxar até o queixo.', equipment:'Polia' },
          { name:'Remada Sentada Polia', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Romboides, dorsais médios', note:'Apertar escápulas no topo.', equipment:'Polia' },
          { name:'Rosca Direta Barra', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Bíceps', note:'Sem balanço.', equipment:'Barra' },
          { name:'Rosca Concentrada', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Bíceps (pico)', note:'Supinação no topo.', equipment:'Halter' },
        ]
      },
      {
        id:3, name:'Legs A', focus:'Quad & Glúteo', tag:'LEGS A', color:'#dc2626',
        rationale:'Foco em quadríceps com agachamento pesado.',
        exercises:[
          { name:'Agachamento Livre', sets:'5', reps:'5–6', rest:'4 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Intensidade máxima.', equipment:'Barra' },
          { name:'Leg Press 45°', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Quad, glúteo', note:'Pés médios.', equipment:'Máquina' },
          { name:'Cadeira Extensora', sets:'3', reps:'15–20', rest:'90s', rir:'RIR 1', muscle:'Quad isolamento', note:'Pausa na contração.', equipment:'Máquina' },
          { name:'Afundo Búlgaro', sets:'3', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Glúteo, quad', note:'Pé traseiro elevado.', equipment:'Halter' },
          { name:'Panturrilha em Pé', sets:'5', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Panturrilha', note:'Pausa no estiramento.', equipment:'Máquina' },
        ]
      },
      {
        id:4, name:'Push B', focus:'Ombro & Peito', tag:'PUSH B', color:'#dc2626',
        rationale:'Segunda sessão push com ênfase em ombros.',
        exercises:[
          { name:'Desenvolvimento Halter', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 2', muscle:'Deltóide', note:'Amplitude máxima.', equipment:'Halter' },
          { name:'Elevação Lateral Machine', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Controle total.', equipment:'Máquina' },
          { name:'Supino Declinado', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Peitoral inferior', note:'Menor ângulo de declinação.', equipment:'Barra' },
          { name:'Peck Deck', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Peitoral isolamento', note:'Não abra demais os braços.', equipment:'Máquina' },
          { name:'Francês Polia', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Tríceps porção longa', note:'Cotovelos fixos.', equipment:'Polia' },
        ]
      },
      {
        id:5, name:'Pull B', focus:'Costas & Posterior', tag:'PULL B', color:'#94a3b8',
        rationale:'Segunda sessão pull com deltóide posterior.',
        exercises:[
          { name:'Terra Convencional', sets:'4', reps:'5–6', rest:'4 min', rir:'RIR 2', muscle:'Cadeia posterior', note:'Exercício rei de força.', equipment:'Barra' },
          { name:'Remada com Halter', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Dorsais', note:'Um braço por vez.', equipment:'Halter' },
          { name:'Facepull', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Rotação externa no final.', equipment:'Polia' },
          { name:'Crucifixo Invertido', sets:'3', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Inclinado para frente.', equipment:'Halter' },
          { name:'Rosca Martelo', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Bíceps braquial', note:'Pegada neutra.', equipment:'Halter' },
        ]
      },
      {
        id:6, name:'Legs B', focus:'Posterior & Isquio', tag:'LEGS B', color:'#dc2626',
        rationale:'Segunda sessão de pernas com foco em isquiotibiais.',
        exercises:[
          { name:'Terra Romeno', sets:'4', reps:'8–10', rest:'3 min', rir:'RIR 2', muscle:'Isquiotibiais, glúteo', note:'Coluna neutra durante todo o movimento.', equipment:'Barra' },
          { name:'Mesa Flexora', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Isquiotibiais', note:'Descida em 3s.', equipment:'Máquina' },
          { name:'Hip Thrust', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Glúteo', note:'Pausa de 2s no topo.', equipment:'Barra' },
          { name:'Cadeira Abdutora', sets:'3', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Glúteo médio', note:'Pés paralelos.', equipment:'Máquina' },
          { name:'Panturrilha Sentada', sets:'4', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Sóleo', note:'Peso moderado, amplitude total.', equipment:'Máquina' },
        ]
      },
    ]
  },

  arnoldSplit: {
    name: 'Arnold Split 6x',
    gymType: 'full',
    description: 'Split de peito+costas, ombro+braços e pernas — preferido por Arnold',
    frequency: '6 dias/semana',
    level: 'Avançado',
    days: [
      {
        id:1, name:'Peito & Costas A', focus:'Peito & Costas Volume', tag:'PC A', color:'#dc2626',
        rationale:'Antagonistas treinados juntos para maior bombeamento e eficiência.',
        exercises:[
          { name:'Supino Reto', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Peitoral', note:'Composto principal.', equipment:'Barra' },
          { name:'Barra Fixa', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Dorsais', note:'Após cada série de supino.', equipment:'Barra fixa' },
          { name:'Supino Inclinado Halter', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 1', muscle:'Peitoral superior', note:'Amplitude completa.', equipment:'Halter' },
          { name:'Remada Curvada', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 1', muscle:'Costas espessura', note:'Supinado.', equipment:'Barra' },
          { name:'Crossover', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Peitoral isolamento', note:'Squeeze no topo.', equipment:'Polia' },
          { name:'Pullover', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Dorsais + peitoral', note:'Movimento único de dois músculos.', equipment:'Halter' },
        ]
      },
      {
        id:2, name:'Ombro & Braços A', focus:'Deltóide, Bíceps e Tríceps', tag:'OB A', color:'#94a3b8',
        rationale:'Ombros com alto volume de isolamento mais braços completos.',
        exercises:[
          { name:'Arnold Press', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 2', muscle:'Deltóide (todos os feixes)', note:'Rotação pronado→supinado. Exercício criado por Arnold.', equipment:'Halter' },
          { name:'Elevação Lateral', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Alto volume.', equipment:'Halter' },
          { name:'Rosca Direta', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Bíceps', note:'Supinação máxima no topo.', equipment:'Barra' },
          { name:'Tríceps Mergulho', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Tríceps', note:'Usando banco ou paralelas.', equipment:'Barra paralela' },
          { name:'Rosca Concentrada', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Bíceps pico', note:'Um braço por vez.', equipment:'Halter' },
          { name:'Tríceps Francês', sets:'3', reps:'12–15', rest:'60s', rir:'RIR 1', muscle:'Tríceps porção longa', note:'Cotovelos para cima.', equipment:'Halter' },
        ]
      },
      {
        id:3, name:'Pernas A', focus:'Quad & Panturrilha', tag:'LEGS A', color:'#dc2626',
        rationale:'Volume alto em quadríceps com exercícios compostos e isolamento.',
        exercises:[
          { name:'Agachamento Livre', sets:'5', reps:'6–8', rest:'4 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Abaixo do paralelo.', equipment:'Barra' },
          { name:'Leg Press 45°', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Quad', note:'Pés na largura do ombro.', equipment:'Máquina' },
          { name:'Cadeira Extensora', sets:'4', reps:'15–20', rest:'90s', rir:'RIR 1', muscle:'Quad isolamento', note:'Pausa de 1s no topo.', equipment:'Máquina' },
          { name:'Panturrilha em Pé', sets:'5', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Gastrocnêmio', note:'Amplitude total.', equipment:'Máquina' },
          { name:'Panturrilha Sentada', sets:'4', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Sóleo', note:'Peso moderado, muitas reps.', equipment:'Máquina' },
        ]
      },
      {
        id:4, name:'Peito & Costas B', focus:'Peito & Costas Força', tag:'PC B', color:'#dc2626',
        rationale:'Segunda sessão com ênfase em exercícios de força.',
        exercises:[
          { name:'Supino Declinado', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Peitoral inferior', note:'Banco a 30° de declinação.', equipment:'Barra' },
          { name:'Remada com Halter', sets:'4', reps:'10–12', rest:'90s', rir:'RIR 1', muscle:'Dorsais', note:'Um braço por vez, rotação de tronco leve.', equipment:'Halter' },
          { name:'Peck Deck', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Peitoral', note:'Squeeze no topo.', equipment:'Máquina' },
          { name:'Puxada Polia Alta', sets:'3', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Dorsais largura', note:'Puxar até o esterno.', equipment:'Polia' },
          { name:'Elevação Frontal', sets:'3', reps:'12', rest:'60s', rir:'RIR 1', muscle:'Peitoral/deltóide', note:'Alternado.', equipment:'Halter' },
        ]
      },
      {
        id:5, name:'Ombro & Braços B', focus:'Volume Ombro e Braços', tag:'OB B', color:'#94a3b8',
        rationale:'Segunda sessão com variações e alto volume.',
        exercises:[
          { name:'Desenvolvimento Máquina', sets:'4', reps:'12–15', rest:'90s', rir:'RIR 1', muscle:'Deltóide', note:'Menor carga, mais controle.', equipment:'Máquina' },
          { name:'Elevação Lateral Polia', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Tensão constante vs halteres.', equipment:'Polia' },
          { name:'Rosca Alternada', sets:'4', reps:'12/braço', rest:'90s', rir:'RIR 1', muscle:'Bíceps', note:'Com supinação.', equipment:'Halter' },
          { name:'Tríceps Polia Corda', sets:'4', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Abrir corda no final.', equipment:'Polia' },
          { name:'Rosca Spider', sets:'3', reps:'12', rest:'60s', rir:'RIR 1', muscle:'Bíceps pico', note:'Banco inclinado, cotovelo fixo.', equipment:'Halter' },
        ]
      },
      {
        id:6, name:'Pernas B', focus:'Posterior & Glúteo', tag:'LEGS B', color:'#dc2626',
        rationale:'Segunda sessão focada em cadeia posterior.',
        exercises:[
          { name:'Terra Romeno', sets:'4', reps:'8–10', rest:'3 min', rir:'RIR 2', muscle:'Isquiotibiais, glúteo', note:'Coluna neutra.', equipment:'Barra' },
          { name:'Hip Thrust', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 1', muscle:'Glúteo máximo', note:'Pausa de 2s no topo.', equipment:'Barra' },
          { name:'Mesa Flexora', sets:'4', reps:'12', rest:'2 min', rir:'RIR 1', muscle:'Isquiotibiais', note:'Descida lenta.', equipment:'Máquina' },
          { name:'Afundo Caminhando', sets:'3', reps:'12/perna', rest:'90s', rir:'RIR 2', muscle:'Glúteo, quad', note:'Passada longa.', equipment:'Halter' },
          { name:'Cadeira Abdutora', sets:'3', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Glúteo médio', note:'Pés paralelos.', equipment:'Máquina' },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════════════════
  // ACADEMIA BÁSICA (halteres, barra, banco — sem máquinas)
  // ════════════════════════════════════════════════════════════════

  basicFullBody3: {
    name: 'Full Body 3x (Academia Básica)',
    gymType: 'basic',
    description: 'Treino de corpo inteiro 3x por semana com halteres e barra',
    frequency: '3 dias/semana',
    level: 'Iniciante–Intermediário',
    days: [
      {
        id:1, name:'Full Body A', focus:'Força + Condicionamento', tag:'FB A', color:'#dc2626',
        rationale:'Treinos completos permitem alta frequência sem overtraining.',
        exercises:[
          { name:'Agachamento com Barra', sets:'4', reps:'8', rest:'3 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Use o rack ou agache com halteres na falta de rack.', equipment:'Barra' },
          { name:'Supino com Halter', sets:'4', reps:'10', rest:'2 min', rir:'RIR 2', muscle:'Peitoral', note:'Amplitude completa, cotovelo em 45°.', equipment:'Halter' },
          { name:'Remada com Halter', sets:'4', reps:'10/braço', rest:'2 min', rir:'RIR 2', muscle:'Dorsais', note:'Joelho e mão apoiados no banco.', equipment:'Halter' },
          { name:'Desenvolvimento Halter', sets:'3', reps:'12', rest:'90s', rir:'RIR 2', muscle:'Deltóide', note:'Sentado, core contraído.', equipment:'Halter' },
          { name:'Rosca Direta', sets:'3', reps:'12', rest:'60s', rir:'RIR 1', muscle:'Bíceps', note:'Alternado ou simultâneo.', equipment:'Halter' },
          { name:'Tríceps Francês Halter', sets:'3', reps:'12', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Um halter com as duas mãos.', equipment:'Halter' },
        ]
      },
      {
        id:2, name:'Full Body B', focus:'Variação de exercícios', tag:'FB B', color:'#94a3b8',
        rationale:'Variação dos padrões de movimento para estímulo completo.',
        exercises:[
          { name:'Terra com Halteres', sets:'4', reps:'8', rest:'3 min', rir:'RIR 2', muscle:'Cadeia posterior', note:'Halteres nas laterais do corpo.', equipment:'Halter' },
          { name:'Afundo com Halter', sets:'3', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Glúteo, quad', note:'Passada longa à frente.', equipment:'Halter' },
          { name:'Supino Inclinado Halter', sets:'4', reps:'10', rest:'2 min', rir:'RIR 2', muscle:'Peitoral superior', note:'Banco a 45°.', equipment:'Halter' },
          { name:'Remada Curvada Halter', sets:'4', reps:'10', rest:'2 min', rir:'RIR 2', muscle:'Costas', note:'Ambos os braços juntos.', equipment:'Halter' },
          { name:'Elevação Lateral', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Peso leve, alto controle.', equipment:'Halter' },
          { name:'Rosca Martelo', sets:'3', reps:'12', rest:'60s', rir:'RIR 2', muscle:'Bíceps braquial', note:'Pegada neutra.', equipment:'Halter' },
        ]
      },
      {
        id:3, name:'Full Body C', focus:'Força Máxima', tag:'FB C', color:'#dc2626',
        rationale:'Terceira sessão com ênfase em cargas maiores nos compostos.',
        exercises:[
          { name:'Agachamento Goblet', sets:'4', reps:'12', rest:'2 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Halter segurado na frente do peito.', equipment:'Halter' },
          { name:'Hip Thrust com Halter', sets:'4', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Glúteo', note:'Costas apoiadas no banco.', equipment:'Halter' },
          { name:'Flexão com Pés Elevados', sets:'3', reps:'Máx', rest:'2 min', rir:'RIR 1', muscle:'Peitoral superior', note:'Pés em cadeira ou banco.', equipment:'Peso corporal' },
          { name:'Barra Fixa', sets:'4', reps:'Máx', rest:'2 min', rir:'RIR 2', muscle:'Dorsais', note:'Se não tiver barra, faça remada no TRX ou elástico.', equipment:'Barra fixa' },
          { name:'Tríceps Mergulho Banco', sets:'3', reps:'Máx', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Mãos no banco atrás, corpo afastado.', equipment:'Banco' },
          { name:'Panturrilha em Pé', sets:'4', reps:'20', rest:'45s', rir:'RIR 1', muscle:'Panturrilha', note:'Uma perna por vez para dificultar.', equipment:'Peso corporal' },
        ]
      },
    ]
  },

  basicUpperLower4: {
    name: 'Upper / Lower 4x (Academia Básica)',
    gymType: 'basic',
    description: 'Split de 4 dias upper/lower com halteres, barra e banco',
    frequency: '4 dias/semana',
    level: 'Intermediário',
    days: [
      {
        id:1, name:'Upper A', focus:'Push + Pull', tag:'UPPER A', color:'#dc2626',
        rationale:'Trabalhar empurrar e puxar na mesma sessão maximiza o bombeamento.',
        exercises:[
          { name:'Supino com Halter', sets:'4', reps:'8–10', rest:'2 min', rir:'RIR 2', muscle:'Peitoral', note:'Amplitude completa.', equipment:'Halter' },
          { name:'Remada com Halter', sets:'4', reps:'10/braço', rest:'2 min', rir:'RIR 2', muscle:'Dorsais', note:'Um braço por vez.', equipment:'Halter' },
          { name:'Desenvolvimento Halter', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 2', muscle:'Deltóide', note:'Sentado no banco.', equipment:'Halter' },
          { name:'Elevação Lateral', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Peso moderado.', equipment:'Halter' },
          { name:'Rosca Direta', sets:'3', reps:'12', rest:'60s', rir:'RIR 2', muscle:'Bíceps', note:'Sem balanço.', equipment:'Halter' },
          { name:'Tríceps Francês', sets:'3', reps:'12', rest:'60s', rir:'RIR 2', muscle:'Tríceps', note:'Cotovelos fixos.', equipment:'Halter' },
        ]
      },
      {
        id:2, name:'Lower A', focus:'Quad & Glúteo', tag:'LOWER A', color:'#94a3b8',
        rationale:'Quadríceps como foco principal com volume em glúteo.',
        exercises:[
          { name:'Agachamento Halter', sets:'4', reps:'8–10', rest:'3 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Halteres nas laterais ou goblet.', equipment:'Halter' },
          { name:'Afundo com Halter', sets:'4', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Glúteo, quad', note:'Passada longa.', equipment:'Halter' },
          { name:'Hip Thrust com Halter', sets:'4', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Glúteo', note:'Pausa de 2s no topo.', equipment:'Halter' },
          { name:'Terra Romeno Halter', sets:'4', reps:'10', rest:'2 min', rir:'RIR 2', muscle:'Isquiotibiais, glúteo', note:'Descida controlada.', equipment:'Halter' },
          { name:'Panturrilha em Pé', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Panturrilha', note:'Amplitude total.', equipment:'Halter' },
        ]
      },
      {
        id:3, name:'Upper B', focus:'Ombro & Volume', tag:'UPPER B', color:'#dc2626',
        rationale:'Segunda sessão upper com mais volume em ombros e braços.',
        exercises:[
          { name:'Supino Inclinado Halter', sets:'4', reps:'10–12', rest:'2 min', rir:'RIR 2', muscle:'Peitoral superior', note:'Banco inclinado.', equipment:'Halter' },
          { name:'Remada Curvada Halter', sets:'4', reps:'10', rest:'2 min', rir:'RIR 2', muscle:'Costas', note:'Ambos os braços.', equipment:'Halter' },
          { name:'Elevação Lateral', sets:'4', reps:'15–20', rest:'60s', rir:'RIR 1', muscle:'Deltóide lateral', note:'Peso leve, muitas reps.', equipment:'Halter' },
          { name:'Crucifixo Invertido', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Inclinado para frente.', equipment:'Halter' },
          { name:'Rosca Martelo', sets:'3', reps:'12', rest:'60s', rir:'RIR 2', muscle:'Bíceps braquial', note:'Pegada neutra.', equipment:'Halter' },
          { name:'Tríceps Mergulho Banco', sets:'3', reps:'Máx', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Pés no chão ou elevados.', equipment:'Banco' },
        ]
      },
      {
        id:4, name:'Lower B', focus:'Posterior & Força', tag:'LOWER B', color:'#94a3b8',
        rationale:'Segunda sessão de pernas com ênfase em cadeia posterior.',
        exercises:[
          { name:'Terra Halter', sets:'4', reps:'6–8', rest:'3 min', rir:'RIR 2', muscle:'Cadeia posterior', note:'Halteres nas laterais.', equipment:'Halter' },
          { name:'Agachamento Búlgaro', sets:'4', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Glúteo, quad', note:'Pé traseiro no banco.', equipment:'Halter' },
          { name:'Passada Caminhando', sets:'3', reps:'12/perna', rest:'90s', rir:'RIR 2', muscle:'Glúteo, quad', note:'Passada longa, tronco ereto.', equipment:'Halter' },
          { name:'Terra Romeno Uma Perna', sets:'3', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Isquiotibiais, glúteo', note:'Equilíbrio e força de glúteo.', equipment:'Halter' },
          { name:'Panturrilha Sentado', sets:'4', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Sóleo', note:'Halter no joelho como resistência.', equipment:'Halter' },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════════════════
  // EM CASA (sem equipamento ou com equipamento mínimo)
  // ════════════════════════════════════════════════════════════════

  homeCalisthenics3: {
    name: 'Calistenia Full Body 3x',
    gymType: 'home',
    description: 'Treino completo em casa sem equipamento — peso corporal',
    frequency: '3 dias/semana',
    level: 'Iniciante–Intermediário',
    days: [
      {
        id:1, name:'Empurrar & Core', focus:'Peito, Ombro, Tríceps', tag:'PUSH', color:'#dc2626',
        rationale:'Padrões de empurrar desenvolvem peito, ombro e tríceps sem equipamento.',
        exercises:[
          { name:'Flexão de Braço', sets:'4', reps:'Máx', rest:'2 min', rir:'RIR 1', muscle:'Peitoral, tríceps', note:'Mãos na largura do ombro. Adapte: joelhos no chão para iniciante.', equipment:'Peso corporal' },
          { name:'Flexão Diamante', sets:'3', reps:'8–12', rest:'90s', rir:'RIR 1', muscle:'Tríceps, peitoral interno', note:'Mãos juntas formando um losango.', equipment:'Peso corporal' },
          { name:'Pike Push Up', sets:'3', reps:'10–12', rest:'90s', rir:'RIR 1', muscle:'Deltóide', note:'Quadril elevado, cabeça vai ao chão.', equipment:'Peso corporal' },
          { name:'Flexão Declinada', sets:'3', reps:'10–15', rest:'90s', rir:'RIR 1', muscle:'Peitoral superior', note:'Pés em cadeira ou sofá.', equipment:'Peso corporal' },
          { name:'Tríceps Mergulho Cadeira', sets:'3', reps:'Máx', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Mãos na borda da cadeira.', equipment:'Cadeira' },
          { name:'Prancha', sets:'3', reps:'45–60s', rest:'60s', rir:'RIR 1', muscle:'Core', note:'Corpo reto como uma tábua.', equipment:'Peso corporal' },
        ]
      },
      {
        id:2, name:'Puxar & Costas', focus:'Dorsais, Bíceps, Posterior', tag:'PULL', color:'#94a3b8',
        rationale:'Padrões de puxar são mais difíceis sem barra — use criatividade.',
        exercises:[
          { name:'Barra Fixa (se tiver)', sets:'4', reps:'Máx', rest:'3 min', rir:'RIR 1', muscle:'Dorsais, bíceps', note:'Se não tiver barra, use elástico de resistência.', equipment:'Barra fixa' },
          { name:'Remada na Mesa', sets:'4', reps:'12–15', rest:'2 min', rir:'RIR 1', muscle:'Costas', note:'Deite abaixo de uma mesa resistente. Puxe o peito até a borda.', equipment:'Mesa' },
          { name:'Remada Elástico', sets:'4', reps:'15', rest:'90s', rir:'RIR 1', muscle:'Costas médias', note:'Elástico preso numa porta ou poste.', equipment:'Elástico' },
          { name:'Rosca com Elástico', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Bíceps', note:'Pise no elástico, puxe até o ombro.', equipment:'Elástico' },
          { name:'Superman', sets:'4', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Lombar, glúteo', note:'Deitado de bruços, eleva braços e pernas.', equipment:'Peso corporal' },
          { name:'Crucifixo Invertido no Chão', sets:'3', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Deltóide posterior', note:'Deitado de bruços com halteres leves.', equipment:'Halter leve' },
        ]
      },
      {
        id:3, name:'Pernas & Glúteo', focus:'Quad, Glúteo, Panturrilha', tag:'LEGS', color:'#dc2626',
        rationale:'Pernas respondem bem ao treino de peso corporal com volume alto.',
        exercises:[
          { name:'Agachamento', sets:'4', reps:'20', rest:'2 min', rir:'RIR 1', muscle:'Quad, glúteo', note:'Paralelo ou abaixo. Adicione peso se ficou fácil.', equipment:'Peso corporal' },
          { name:'Afundo Estático', sets:'4', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Glúteo, quad', note:'Pé da frente avançado, desça e suba.', equipment:'Peso corporal' },
          { name:'Hip Thrust no Chão', sets:'4', reps:'20', rest:'90s', rir:'RIR 1', muscle:'Glúteo', note:'Costas no chão, pés apoiados. Eleve o quadril.', equipment:'Peso corporal' },
          { name:'Agachamento Búlgaro', sets:'3', reps:'10/perna', rest:'2 min', rir:'RIR 2', muscle:'Glúteo, quad', note:'Pé traseiro numa cadeira.', equipment:'Cadeira' },
          { name:'Stiff Uma Perna', sets:'3', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Isquiotibiais', note:'Equilíbrio numa perna só.', equipment:'Peso corporal' },
          { name:'Panturrilha em Pé', sets:'5', reps:'20', rest:'45s', rir:'RIR 1', muscle:'Panturrilha', note:'Uma perna por vez na beira de um degrau.', equipment:'Degrau' },
        ]
      },
    ]
  },

  homeHIIT4: {
    name: 'HIIT + Força Casa 4x',
    gymType: 'home',
    description: 'Alternância de treino de força e HIIT para perda de gordura em casa',
    frequency: '4 dias/semana',
    level: 'Intermediário',
    days: [
      {
        id:1, name:'Força Superior', focus:'Peito, Ombro, Costas', tag:'FORÇA UP', color:'#dc2626',
        rationale:'Treino de força em circuito para maximizar gasto calórico.',
        exercises:[
          { name:'Flexão Normal', sets:'4', reps:'Máx-2', rest:'90s', rir:'RIR 2', muscle:'Peitoral, tríceps', note:'Pare 2 reps antes da falha.', equipment:'Peso corporal' },
          { name:'Remada na Mesa', sets:'4', reps:'12', rest:'90s', rir:'RIR 2', muscle:'Costas', note:'Debaixo da mesa resistente.', equipment:'Mesa' },
          { name:'Pike Push Up', sets:'3', reps:'10', rest:'90s', rir:'RIR 2', muscle:'Deltóide', note:'Quadril elevado alto.', equipment:'Peso corporal' },
          { name:'Flexão Diamante', sets:'3', reps:'10', rest:'60s', rir:'RIR 1', muscle:'Tríceps', note:'Mãos em losango.', equipment:'Peso corporal' },
          { name:'Prancha Lateral', sets:'3', reps:'30s/lado', rest:'60s', rir:'RIR 1', muscle:'Core oblíquo', note:'Corpo em linha reta.', equipment:'Peso corporal' },
        ]
      },
      {
        id:2, name:'HIIT Cardio', focus:'Condicionamento Intenso', tag:'HIIT', color:'#94a3b8',
        rationale:'HIIT queima gordura e melhora condicionamento em 20-30 minutos.',
        exercises:[
          { name:'Burpee', sets:'5', reps:'10', rest:'30s', rir:'RIR 1', muscle:'Corpo inteiro', note:'Explosão máxima. 30s de esforço, 30s descanso.', equipment:'Peso corporal' },
          { name:'Mountain Climber', sets:'4', reps:'20/perna', rest:'20s', rir:'RIR 1', muscle:'Core, cardio', note:'Rápido, alternando pernas.', equipment:'Peso corporal' },
          { name:'Jump Squat', sets:'4', reps:'15', rest:'30s', rir:'RIR 1', muscle:'Quad, glúteo, cardio', note:'Explosive jump ao subir.', equipment:'Peso corporal' },
          { name:'High Knees', sets:'4', reps:'30s', rest:'15s', rir:'RIR 1', muscle:'Cardio, core', note:'Joelhos acima do quadril.', equipment:'Peso corporal' },
          { name:'Jumping Jack', sets:'3', reps:'30s', rest:'15s', rir:'RIR 1', muscle:'Cardio total', note:'Para desacelerar no final.', equipment:'Peso corporal' },
        ]
      },
      {
        id:3, name:'Força Inferior', focus:'Glúteo, Quad, Isquio', tag:'FORÇA DOWN', color:'#dc2626',
        rationale:'Alto volume de pernas com peso corporal.',
        exercises:[
          { name:'Agachamento Sumô', sets:'4', reps:'20', rest:'90s', rir:'RIR 1', muscle:'Glúteo, adutores', note:'Pés bem abertos, pontão para fora.', equipment:'Peso corporal' },
          { name:'Hip Thrust Uma Perna', sets:'4', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Glúteo', note:'Pé de apoio no chão, outro elevado.', equipment:'Peso corporal' },
          { name:'Afundo Reverso', sets:'4', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Glúteo, quad', note:'Passo para trás.', equipment:'Peso corporal' },
          { name:'Stiff Uma Perna', sets:'3', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Isquiotibiais', note:'Equilíbrio e força posterior.', equipment:'Peso corporal' },
          { name:'Panturrilha Degrau', sets:'5', reps:'20/perna', rest:'30s', rir:'RIR 1', muscle:'Panturrilha', note:'Amplitude total.', equipment:'Degrau' },
        ]
      },
      {
        id:4, name:'Circuito Total', focus:'Corpo Inteiro Funcional', tag:'TOTAL', color:'#94a3b8',
        rationale:'Circuito finaliza a semana trabalhando todos os músculos.',
        exercises:[
          { name:'Flexão de Braço', sets:'3', reps:'Máx', rest:'60s', rir:'RIR 1', muscle:'Peitoral', note:'Vá até a falha.', equipment:'Peso corporal' },
          { name:'Agachamento', sets:'3', reps:'20', rest:'60s', rir:'RIR 1', muscle:'Pernas', note:'Rápido e controlado.', equipment:'Peso corporal' },
          { name:'Burpee', sets:'3', reps:'8', rest:'60s', rir:'RIR 1', muscle:'Total', note:'Explosivo.', equipment:'Peso corporal' },
          { name:'Superman', sets:'3', reps:'15', rest:'45s', rir:'RIR 1', muscle:'Lombar', note:'Braços e pernas ao mesmo tempo.', equipment:'Peso corporal' },
          { name:'Prancha', sets:'3', reps:'60s', rest:'45s', rir:'RIR 1', muscle:'Core', note:'Posição estável.', equipment:'Peso corporal' },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════════════════
  // AO AR LIVRE / CALISTENIA
  // ════════════════════════════════════════════════════════════════

  outdoorCalisthenics4: {
    name: 'Street Workout 4x',
    gymType: 'outdoor',
    description: 'Calistenia de rua com barras e peso corporal — foco em força e estética',
    frequency: '4 dias/semana',
    level: 'Intermediário–Avançado',
    days: [
      {
        id:1, name:'Push Day', focus:'Peito & Tríceps', tag:'PUSH', color:'#dc2626',
        rationale:'Variações de flexão desenvolvem peito e tríceps sem academia.',
        exercises:[
          { name:'Paralelas (Mergulho)', sets:'5', reps:'8–12', rest:'3 min', rir:'RIR 2', muscle:'Peitoral inferior, tríceps', note:'Exercício fundamental do street workout.', equipment:'Paralelas' },
          { name:'Flexão Fechada', sets:'4', reps:'12–15', rest:'2 min', rir:'RIR 1', muscle:'Tríceps, peitoral', note:'Mãos próximas ao esterno.', equipment:'Peso corporal' },
          { name:'Flexão com Pés Elevados', sets:'4', reps:'12–15', rest:'2 min', rir:'RIR 1', muscle:'Peitoral superior', note:'Pés no banco ou barra baixa.', equipment:'Barra baixa' },
          { name:'Pike Push Up', sets:'3', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Deltóide', note:'Progressão para handstand push up.', equipment:'Peso corporal' },
          { name:'Explosive Push Up', sets:'3', reps:'8', rest:'2 min', rir:'RIR 1', muscle:'Peito (potência)', note:'Palmas saem do chão.', equipment:'Peso corporal' },
        ]
      },
      {
        id:2, name:'Pull Day', focus:'Costas & Bíceps', tag:'PULL', color:'#94a3b8',
        rationale:'Variações de barra fixa desenvolvem costas largas e bíceps fortes.',
        exercises:[
          { name:'Barra Fixa Pronada', sets:'5', reps:'6–10', rest:'3 min', rir:'RIR 2', muscle:'Dorsais largura', note:'Exercício básico fundamental.', equipment:'Barra fixa' },
          { name:'Barra Fixa Supinada', sets:'4', reps:'8–12', rest:'2 min', rir:'RIR 2', muscle:'Bíceps, dorsais', note:'Cotovelos colados ao corpo.', equipment:'Barra fixa' },
          { name:'Australiana (Remada Barra Baixa)', sets:'4', reps:'12–15', rest:'2 min', rir:'RIR 1', muscle:'Costas médias', note:'Corpo inclinado, puxe o peito até a barra.', equipment:'Barra baixa' },
          { name:'Barra Fixa Lenta', sets:'3', reps:'5', rest:'3 min', rir:'RIR 2', muscle:'Dorsais (força máxima)', note:'Suba em 2s, desça em 5s.', equipment:'Barra fixa' },
          { name:'Towel Row (Remada com Toalha)', sets:'3', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Costas médias', note:'Toalha numa barra ou poste.', equipment:'Toalha' },
        ]
      },
      {
        id:3, name:'Pernas & Core', focus:'Força de Pernas e Estabilidade', tag:'LEGS', color:'#dc2626',
        rationale:'Pernas fortes são base para todo o street workout.',
        exercises:[
          { name:'Pistol Squat Progressão', sets:'4', reps:'5–8/perna', rest:'3 min', rir:'RIR 2', muscle:'Quad, glúteo', note:'Use apoio se necessário. Progride para sem apoio.', equipment:'Barra de apoio' },
          { name:'Agachamento Explosivo', sets:'4', reps:'10', rest:'2 min', rir:'RIR 1', muscle:'Quad, glúteo, potência', note:'Salto máximo a cada rep.', equipment:'Peso corporal' },
          { name:'Afundo Reverso', sets:'4', reps:'12/perna', rest:'90s', rir:'RIR 1', muscle:'Glúteo, quad', note:'Passada para trás, bem controlada.', equipment:'Peso corporal' },
          { name:'L-Sit (Progr.)', sets:'4', reps:'15–20s', rest:'90s', rir:'RIR 1', muscle:'Core, flexores do quadril', note:'Comece com joelhos dobrados.', equipment:'Paralelas' },
          { name:'Dragon Flag (Progr.)', sets:'3', reps:'5–8', rest:'2 min', rir:'RIR 1', muscle:'Core total', note:'Segure uma barra, mantenha corpo reto ao descer.', equipment:'Barra' },
        ]
      },
      {
        id:4, name:'Skills & Volume', focus:'Habilidades & Resistência', tag:'SKILLS', color:'#94a3b8',
        rationale:'Desenvolver habilidades específicas do calistenia aumenta a estética e capacidade.',
        exercises:[
          { name:'Muscle Up Progressão', sets:'5', reps:'3–5', rest:'3 min', rir:'RIR 2', muscle:'Corpo inteiro', note:'Explosão do puxar para empurrar. Mais difícil do street workout.', equipment:'Barra fixa' },
          { name:'Handstand Hold', sets:'4', reps:'20–30s', rest:'2 min', rir:'RIR 1', muscle:'Ombros, core', note:'Parede para apoio no início.', equipment:'Parede' },
          { name:'Leaning Planche', sets:'4', reps:'15–20s', rest:'2 min', rir:'RIR 1', muscle:'Core, peito, ombros', note:'Incline o corpo progressivamente para frente.', equipment:'Paralelas' },
          { name:'Explosive Pull Up', sets:'3', reps:'5', rest:'3 min', rir:'RIR 2', muscle:'Dorsais (potência)', note:'Puxe até o peito tocar a barra.', equipment:'Barra fixa' },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════════════════
  // CROSSFIT / FUNCIONAL
  // ════════════════════════════════════════════════════════════════

  crossfit5: {
    name: 'CrossFit Style 5x',
    gymType: 'crossfit',
    description: 'WODs de alta intensidade com movimentos olímpicos e ginásticos',
    frequency: '5 dias/semana',
    level: 'Intermediário–Avançado',
    days: [
      {
        id:1, name:'Levantamento & WOD', focus:'Força Olímpica + Condicionamento', tag:'STR+WOD', color:'#dc2626',
        rationale:'Combinar levantamentos pesados com WOD metcon maximiza força e resistência.',
        exercises:[
          { name:'Agachamento Frontal (Front Squat)', sets:'5', reps:'3', rest:'3 min', rir:'RIR 2', muscle:'Quad, core, ombros', note:'Cotovelos altos. Movimento olímpico.', equipment:'Barra' },
          { name:'Push Press', sets:'4', reps:'5', rest:'3 min', rir:'RIR 2', muscle:'Deltóide, tríceps, glúteo', note:'Impulso das pernas + empurrar overhead.', equipment:'Barra' },
          { name:'Kettlebell Swing', sets:'5', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Glúteo, posterior, cardio', note:'Quadril como motor, não costas.', equipment:'Kettlebell' },
          { name:'Box Jump', sets:'4', reps:'8', rest:'90s', rir:'RIR 1', muscle:'Quad, glúteo, potência', note:'Aterrisse com joelhos semiflexionados.', equipment:'Box' },
          { name:'WOD: AMRAP 10min', sets:'1', reps:'AMRAP', rest:'—', rir:'Máximo', muscle:'Total', note:'10 Burpees + 10 Pull-ups + 10 Sit-ups. Máximo de rounds em 10min.', equipment:'Barra fixa' },
        ]
      },
      {
        id:2, name:'Ginástica & Cardio', focus:'Movimentos Ginásticos + Row/Run', tag:'GYM+CARDIO', color:'#94a3b8',
        rationale:'Movimentos ginásticos são base do CrossFit — handstand, muscle-up, ring.',
        exercises:[
          { name:'Handstand Push Up', sets:'4', reps:'5–8', rest:'3 min', rir:'RIR 2', muscle:'Ombros, tríceps', note:'Pé na parede. Use abmat para proteção da cabeça.', equipment:'Parede' },
          { name:'Muscle Up Barra', sets:'4', reps:'3–5', rest:'3 min', rir:'RIR 2', muscle:'Dorsais, peitoral, tríceps', note:'Movimento de transição rápido.', equipment:'Barra fixa' },
          { name:'Toes to Bar', sets:'4', reps:'10', rest:'90s', rir:'RIR 1', muscle:'Core, flexores', note:'Balanceia as pernas até tocar a barra.', equipment:'Barra fixa' },
          { name:'Rope Climb', sets:'3', reps:'1 subida', rest:'2 min', rir:'RIR 2', muscle:'Dorsais, bíceps, core', note:'Use as pernas para economizar os braços.', equipment:'Corda' },
          { name:'WOD: For Time', sets:'1', reps:'—', rest:'—', rir:'Máximo', muscle:'Total', note:'1000m Remo / Run + 50 Thrusters (42.5/30kg) + 30 Pull-ups. Time as fast as possible.', equipment:'Remo / Corrida' },
        ]
      },
      {
        id:3, name:'Força Pura', focus:'Levantamentos Terra e Agachamento', tag:'STRENGTH', color:'#dc2626',
        rationale:'Dia dedicado a construir força máxima nos levantamentos básicos.',
        exercises:[
          { name:'Terra (Deadlift)', sets:'5', reps:'3', rest:'4 min', rir:'RIR 2', muscle:'Cadeia posterior total', note:'Trabalhe próximo ao máximo. 85–95% 1RM.', equipment:'Barra' },
          { name:'Back Squat', sets:'5', reps:'3', rest:'4 min', rir:'RIR 2', muscle:'Quad, glúteo, costas', note:'Carga alta. Movimentos lentos e controlados.', equipment:'Barra' },
          { name:'Shoulder Press Estrito', sets:'4', reps:'5', rest:'3 min', rir:'RIR 2', muscle:'Deltóide, tríceps', note:'Sem impulso de pernas.', equipment:'Barra' },
          { name:'Turkish Get Up', sets:'3', reps:'3/lado', rest:'2 min', rir:'RIR 2', muscle:'Core, ombros, corpo inteiro', note:'Movimento lento e controlado. Nunca perca o olhar da kettlebell.', equipment:'Kettlebell' },
        ]
      },
      {
        id:4, name:'Metcon Intenso', focus:'Condicionamento Metabólico', tag:'METCON', color:'#94a3b8',
        rationale:'Metcon é o coração do CrossFit — condicionamento que mistura força e cardio.',
        exercises:[
          { name:'Thrusters', sets:'4', reps:'10', rest:'90s', rir:'RIR 1', muscle:'Quad, ombro, total', note:'Agachamento + desenvolvimento em um movimento só.', equipment:'Barra' },
          { name:'Double Under (Corda)', sets:'5', reps:'30', rest:'60s', rir:'RIR 1', muscle:'Cardio, coordenação', note:'Corda passa 2x a cada salto.', equipment:'Corda de pular' },
          { name:'Snatch (Arranco)', sets:'5', reps:'3', rest:'3 min', rir:'RIR 2', muscle:'Total olímpico', note:'Movimento técnico. Barra do chão ao overhead em 1 movimento.', equipment:'Barra' },
          { name:'Wall Ball', sets:'4', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Quad, ombro, core', note:'Agacha e arremessa a medicine ball no alvo.', equipment:'Medicine ball' },
          { name:'WOD: Fran', sets:'1', reps:'21-15-9', rest:'—', rir:'Máximo', muscle:'Total', note:'21 Thrusters + 21 Pull-ups → 15+15 → 9+9. Mais icônico WOD do CrossFit. Time it!', equipment:'Barra fixa' },
        ]
      },
      {
        id:5, name:'Endurance & Recovery', focus:'Resistência Aeróbica', tag:'ENDURANCE', color:'#dc2626',
        rationale:'Trabalho aeróbico longo na zona 2 aumenta motor aeróbico e recuperação.',
        exercises:[
          { name:'Row Steady State', sets:'1', reps:'20–30min', rest:'—', rir:'Zona 2', muscle:'Cardio total', note:'FC em 65–75% do máximo. Conversa possível.', equipment:'Remo' },
          { name:'Bike Erg', sets:'1', reps:'20min', rest:'—', rir:'Zona 2', muscle:'Cardio, pernas', note:'Alternativa ao remo.', equipment:'Bike Erg' },
          { name:'Farmers Walk', sets:'5', reps:'40m', rest:'90s', rir:'RIR 1', muscle:'Trapézio, core, pernas', note:'Peso máximo que consiga caminhar ereto.', equipment:'Kettlebell' },
          { name:'Mobility & Stretch', sets:'1', reps:'15min', rest:'—', rir:'Recovery', muscle:'Mobilidade total', note:'Quadril, torácica, ombros. Crucial para longevidade no CrossFit.', equipment:'Peso corporal' },
        ]
      },
    ]
  },

  // Montar ficha própria — usuário cria seus próprios dias e exercícios
  custom: {
    name: 'Minha Ficha',
    gymType: 'full', // aparece em todos os tipos
    description: 'Monte sua própria ficha com dias e exercícios personalizados',
    frequency: 'Personalizado',
    level: 'Personalizado',
    days: [], // preenchido pelo usuário
  },

  functionalFull4: {
    name: 'Funcional 4x (Box ou Parque)',
    gymType: 'crossfit',
    description: 'Treino funcional 4x por semana com movimentos multiarticulares',
    frequency: '4 dias/semana',
    level: 'Iniciante–Intermediário',
    days: [
      {
        id:1, name:'Força Funcional A', focus:'Empurrar & Puxar', tag:'FUNC A', color:'#dc2626',
        rationale:'Padrões fundamentais de empurrar e puxar em planos variados.',
        exercises:[
          { name:'Push Press', sets:'4', reps:'8', rest:'2 min', rir:'RIR 2', muscle:'Ombros, tríceps, glúteo', note:'Use impulso das pernas para auxiliar.', equipment:'Barra / Halter' },
          { name:'Ring Row', sets:'4', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Costas, bíceps', note:'Pés no chão, puxe anéis ao peito.', equipment:'Anéis' },
          { name:'KB Goblet Squat', sets:'4', reps:'12', rest:'90s', rir:'RIR 1', muscle:'Quad, glúteo, core', note:'Kettlebell na frente do peito.', equipment:'Kettlebell' },
          { name:'KB Swing', sets:'4', reps:'15', rest:'60s', rir:'RIR 1', muscle:'Glúteo, posterior, cardio', note:'Quadril explode para frente.', equipment:'Kettlebell' },
          { name:'Farmer Carry', sets:'4', reps:'30m', rest:'90s', rir:'RIR 1', muscle:'Trapézio, core, pernas', note:'Carga máxima com postura ereta.', equipment:'Kettlebell' },
        ]
      },
      {
        id:2, name:'AMRAP & Cardio', focus:'Resistência e Condicionamento', tag:'AMRAP', color:'#94a3b8',
        rationale:'AMRAPs desenvolvem condicionamento mental e físico.',
        exercises:[
          { name:'AMRAP 20min: Burpee', sets:'1', reps:'5', rest:'—', rir:'Máximo', muscle:'Total', note:'5 Burpees + 10 KB Swings + 15 Sit-ups. Máximo de rounds.', equipment:'Kettlebell' },
          { name:'Corrida 400m', sets:'4', reps:'1 volta', rest:'2 min', rir:'RIR 1', muscle:'Cardio, pernas', note:'Ritmo sustentável mas desafiador.', equipment:'Pista' },
          { name:'Box Jump', sets:'3', reps:'10', rest:'90s', rir:'RIR 1', muscle:'Potência de pernas', note:'Aterrisse suave.', equipment:'Box' },
        ]
      },
      {
        id:3, name:'Força Funcional B', focus:'Agachar, Empurrar e Carregar', tag:'FUNC B', color:'#dc2626',
        rationale:'Segunda sessão de força com variações dos padrões fundamentais.',
        exercises:[
          { name:'Front Squat', sets:'4', reps:'6–8', rest:'3 min', rir:'RIR 2', muscle:'Quad, core, ombros', note:'Cotovelos altos.', equipment:'Barra' },
          { name:'Handstand Push Up (Progr)', sets:'4', reps:'5', rest:'2 min', rir:'RIR 2', muscle:'Deltóide, tríceps', note:'Parede para apoio.', equipment:'Parede' },
          { name:'Deadlift', sets:'4', reps:'5', rest:'3 min', rir:'RIR 2', muscle:'Cadeia posterior', note:'Carga pesada.', equipment:'Barra' },
          { name:'Toes to Bar', sets:'4', reps:'8', rest:'90s', rir:'RIR 1', muscle:'Core, flexores', note:'Balanço controlado.', equipment:'Barra fixa' },
          { name:'Single Leg Deadlift', sets:'3', reps:'8/perna', rest:'90s', rir:'RIR 1', muscle:'Isquiotibiais, glúteo', note:'Equilíbrio e força unilateral.', equipment:'Kettlebell' },
        ]
      },
      {
        id:4, name:'Condicionamento Total', focus:'Circuito de Alta Intensidade', tag:'COND', color:'#94a3b8',
        rationale:'Fechar a semana com circuito que desafia todo o corpo.',
        exercises:[
          { name:'EMOM 20min', sets:'1', reps:'EMOM', rest:'—', rir:'Máximo', muscle:'Total', note:'Min 1: 5 Pull-ups | Min 2: 10 Push-ups | Min 3: 15 Squats | Min 4: 20s Plank. Repita 5x.', equipment:'Barra fixa' },
          { name:'Slam Ball', sets:'4', reps:'10', rest:'60s', rir:'RIR 1', muscle:'Core, total', note:'Jogue a bola forte no chão.', equipment:'Slam ball' },
          { name:'L-Sit Hold', sets:'4', reps:'15s', rest:'60s', rir:'RIR 1', muscle:'Core, flexores', note:'Paralelas ou barras paralelas.', equipment:'Paralelas' },
        ]
      },
    ]
  },
}
