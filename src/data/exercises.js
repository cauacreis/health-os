// ─── Banco de exercícios por grupo muscular ────────────────────────────────────
// Permite buscar exercícios por filtro de músculo para montar fichas personalizadas

export const MUSCLE_GROUPS = [
  'Peitoral', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Antebraço',
  'Quadríceps', 'Isquiotibiais', 'Glúteo', 'Panturrilha', 'Abdômen', 'Lombar'
]

// Exercícios indexados por grupo muscular — formato: { name, equipment, note? }
export const EXERCISES_BY_MUSCLE = {

  Peitoral: [
    { name: 'Supino Reto', equipment: 'Barra', note: 'Barra desce até tocar o peito. Arco natural na lombar.' },
    { name: 'Supino Inclinado', equipment: 'Barra', note: 'Banco a 30–45°. Foco no peitoral superior.' },
    { name: 'Supino Declinado', equipment: 'Barra', note: 'Foco no peitoral inferior.' },
    { name: 'Supino com Halter', equipment: 'Halter', note: 'Amplitude completa, cotovelo em 45°.' },
    { name: 'Supino Inclinado Halter', equipment: 'Halter', note: 'Banco a 45°. Amplitude máxima.' },
    { name: 'Supino Declinado Halter', equipment: 'Halter', note: 'Peitoral inferior.' },
    { name: 'Crucifixo Polia', equipment: 'Polia', note: 'Tensão contínua, não trave no topo.' },
    { name: 'Crucifixo Halter', equipment: 'Halter', note: 'Variação com halteres na horizontal.' },
    { name: 'Crucifixo Inclinado', equipment: 'Halter', note: 'Foco no peitoral superior.' },
    { name: 'Crossover', equipment: 'Polia', note: 'Polia alta para peitoral inferior, baixa para superior.' },
    { name: 'Peck Deck', equipment: 'Máquina', note: 'Não abra demais os braços. Squeeze no topo.' },
    { name: 'Flexão de Braço', equipment: 'Peso corporal', note: 'Mãos na largura do ombro.' },
    { name: 'Flexão Diamante', equipment: 'Peso corporal', note: 'Mãos juntas formando losango. Tríceps.' },
    { name: 'Flexão Declinada', equipment: 'Peso corporal', note: 'Pés elevados. Peitoral superior.' },
    { name: 'Flexão com Pés Elevados', equipment: 'Peso corporal', note: 'Pés em banco ou cadeira.' },
    { name: 'Flexão Fechada', equipment: 'Peso corporal', note: 'Mãos próximas ao esterno.' },
    { name: 'Paralelas (Mergulho)', equipment: 'Paralelas', note: 'Peitoral inferior e tríceps.' },
    { name: 'Pullover', equipment: 'Halter', note: 'Cotovelo levemente dobrado durante todo o movimento.' },
    { name: 'Cross-over Cabo', equipment: 'Polia', note: 'Crossover com cabos cruzados.' },
    { name: 'Supino Máquina', equipment: 'Máquina', note: 'Controle total, ideal para iniciantes.' },
  ],

  Costas: [
    { name: 'Barra Fixa', equipment: 'Barra fixa', note: 'Pronada ou supinada. Cotovelo colado ao corpo.' },
    { name: 'Barra Fixa Pronada', equipment: 'Barra fixa', note: 'Dorsais largura.' },
    { name: 'Barra Fixa Supinada', equipment: 'Barra fixa', note: 'Bíceps e dorsais.' },
    { name: 'Remada Curvada', equipment: 'Barra', note: 'Cotovelo colado ao corpo. Espessura das costas.' },
    { name: 'Remada com Halter', equipment: 'Halter', note: 'Um braço por vez. Rotação leve do tronco.' },
    { name: 'Remada Sentada Polia', equipment: 'Polia', note: 'Puxar até o peito. Romboides.' },
    { name: 'Remada Unilateral Polia', equipment: 'Polia', note: 'Um braço por vez.' },
    { name: 'Puxada Polia Alta', equipment: 'Polia', note: 'Puxar até o queixo/esterno.' },
    { name: 'Puxada Fechada', equipment: 'Polia', note: 'Supinada, cotovelo em 45°.' },
    { name: 'Puxada Aberta', equipment: 'Polia', note: 'Largura das dorsais.' },
    { name: 'Remada Curvada Halter', equipment: 'Halter', note: 'Ambos os braços.' },
    { name: 'Remada na Mesa', equipment: 'Mesa', note: 'Puxe o peito até a borda. Casa/escritório.' },
    { name: 'Remada Elástico', equipment: 'Elástico', note: 'Elástico preso em poste ou porta.' },
    { name: 'Australiana (Remada Barra Baixa)', equipment: 'Barra baixa', note: 'Corpo inclinado. Calistenia.' },
    { name: 'Remada T', equipment: 'Barra T', note: 'Espessura central das costas.' },
    { name: 'Pullover', equipment: 'Halter', note: 'Dorsais e peitoral.' },
    { name: 'Terra Convencional', equipment: 'Barra', note: 'Cadeia posterior total.' },
    { name: 'Remada Cavalinho', equipment: 'Máquina', note: 'Espessura das costas.' },
    { name: 'Towel Row', equipment: 'Toalha', note: 'Remada com toalha em barra ou poste.' },
  ],

  Ombro: [
    { name: 'Desenvolvimento Militar', equipment: 'Barra', note: 'Core contraído, sem hiperextensão lombar.' },
    { name: 'Desenvolvimento Halter', equipment: 'Halter', note: 'Amplitude máxima.' },
    { name: 'Desenvolvimento Máquina', equipment: 'Máquina', note: 'Menor carga, mais controle.' },
    { name: 'Arnold Press', equipment: 'Halter', note: 'Rotação pronado→supinado. Todos os feixes.' },
    { name: 'Elevação Lateral', equipment: 'Halter', note: 'Leve inclinação à frente. Polegar levemente para baixo.' },
    { name: 'Elevação Lateral Polia', equipment: 'Polia', note: 'Tensão constante.' },
    { name: 'Elevação Lateral Machine', equipment: 'Máquina', note: 'Controle total.' },
    { name: 'Elevação Frontal', equipment: 'Halter', note: 'Alternado ou simultâneo.' },
    { name: 'Facepull', equipment: 'Polia', note: 'Puxar em direção ao rosto com rotação externa.' },
    { name: 'Crucifixo Invertido', equipment: 'Halter', note: 'Inclinado para frente. Deltóide posterior.' },
    { name: 'Crucifixo Invertido no Chão', equipment: 'Halter', note: 'Deitado de bruços.' },
    { name: 'Pike Push Up', equipment: 'Peso corporal', note: 'Quadril elevado, cabeça vai ao chão.' },
    { name: 'Handstand Push Up', equipment: 'Peso corporal', note: 'Pés na parede. Progressão avançada.' },
    { name: 'Push Press', equipment: 'Barra', note: 'Impulso das pernas + empurrar overhead.' },
    { name: 'Desenvolvimento Sentado', equipment: 'Halter', note: 'Sentado para isolar ombros.' },
    { name: 'Remada Alta', equipment: 'Barra', note: 'Cotovelos para cima. Trapézio e deltóide.' },
  ],

  Bíceps: [
    { name: 'Rosca Direta', equipment: 'Barra', note: 'Sem balanço de tronco.' },
    { name: 'Rosca Direta Barra', equipment: 'Barra', note: 'Pegada pronada ou supinada.' },
    { name: 'Rosca Martelo', equipment: 'Halter', note: 'Pegada neutra.' },
    { name: 'Rosca Concentrada', equipment: 'Halter', note: 'Supinação no topo. Pico do bíceps.' },
    { name: 'Rosca Alternada', equipment: 'Halter', note: 'Um braço por vez com supinação.' },
    { name: 'Rosca Scott', equipment: 'Barra', note: 'Banco Scott. Isolamento do bíceps.' },
    { name: 'Rosca Spider', equipment: 'Barra', note: 'Banco inclinado. Cotovelo fixo.' },
    { name: 'Rosca com Elástico', equipment: 'Elástico', note: 'Pise no elástico, puxe até o ombro.' },
    { name: 'Rosca Polia', equipment: 'Polia', note: 'Cabo baixo. Tensão constante.' },
    { name: 'Rosca Inversa', equipment: 'Barra', note: 'Pegada pronada. Antebraço.' },
    { name: 'Barra Fixa Supinada', equipment: 'Barra fixa', note: 'Foco em bíceps.' },
    { name: 'Rosca 21', equipment: 'Barra', note: '7 reps parcial inferior + 7 superior + 7 completa.' },
  ],

  Tríceps: [
    { name: 'Tríceps Polia', equipment: 'Polia', note: 'Cotovelo fixo ao lado do corpo.' },
    { name: 'Tríceps Polia Corda', equipment: 'Polia', note: 'Abrir corda no final.' },
    { name: 'Tríceps Francês', equipment: 'Halter', note: 'Cotovelos apontados para o teto.' },
    { name: 'Tríceps Francês Halter', equipment: 'Halter', note: 'Um halter com as duas mãos.' },
    { name: 'Francês Polia', equipment: 'Polia', note: 'Cotovelos fixos.' },
    { name: 'Tríceps Mergulho', equipment: 'Barra paralela', note: 'Banco ou paralelas.' },
    { name: 'Tríceps Mergulho Banco', equipment: 'Banco', note: 'Mãos no banco atrás, corpo afastado.' },
    { name: 'Tríceps Mergulho Cadeira', equipment: 'Cadeira', note: 'Mãos na borda da cadeira.' },
    { name: 'Kickback', equipment: 'Halter', note: 'Cotovelo fixo, extensão até trás.' },
    { name: 'Supino Fechado', equipment: 'Barra', note: 'Mãos próximas. Tríceps e peito.' },
    { name: 'Flexão Diamante', equipment: 'Peso corporal', note: 'Mãos em losango.' },
    { name: 'Extensão Tríceps Unilateral', equipment: 'Halter', note: 'Um braço por vez.' },
  ],

  Antebraço: [
    { name: 'Rosca Punho', equipment: 'Barra', note: 'Punhos em cima do joelho.' },
    { name: 'Rosca Punho Inversa', equipment: 'Barra', note: 'Pegada pronada.' },
    { name: 'Rosca Punho Halter', equipment: 'Halter', note: 'Flexão e extensão de punho.' },
    { name: 'Farmer Carry', equipment: 'Halter/Kettlebell', note: 'Carga máxima, postura ereta.' },
    { name: 'Towel Hang', equipment: 'Toalha', note: 'Suspensão com toalha na barra fixa.' },
    { name: 'Wrist Roller', equipment: 'Rolo de punho', note: 'Rolar peso para cima e para baixo.' },
  ],

  Quadríceps: [
    { name: 'Agachamento Livre', equipment: 'Barra', note: 'Paralelo ou abaixo. Joelho no sentido do pé.' },
    { name: 'Agachamento Frontal', equipment: 'Barra', note: 'Cotovelos altos. Front squat.' },
    { name: 'Agachamento com Barra', equipment: 'Barra', note: 'Back squat.' },
    { name: 'Leg Press 45°', equipment: 'Máquina', note: 'Pés na largura do ombro. Não travar joelhos.' },
    { name: 'Cadeira Extensora', equipment: 'Máquina', note: 'Contração isométrica no topo 1s.' },
    { name: 'Agachamento Halter', equipment: 'Halter', note: 'Halteres nas laterais ou goblet.' },
    { name: 'Agachamento Goblet', equipment: 'Halter/Kettlebell', note: 'Halter na frente do peito.' },
    { name: 'Afundo com Barra', equipment: 'Barra', note: 'Passo largo. Joelho não ultrapassa o pé.' },
    { name: 'Afundo com Halter', equipment: 'Halter', note: 'Passada longa à frente.' },
    { name: 'Afundo Búlgaro', equipment: 'Halter', note: 'Pé traseiro elevado.' },
    { name: 'Afundo Estático', equipment: 'Peso corporal', note: 'Pé da frente avançado.' },
    { name: 'Afundo Caminhando', equipment: 'Halter', note: 'Passada longa.' },
    { name: 'Hack Squat', equipment: 'Máquina', note: 'Pés à frente. Quadríceps.' },
    { name: 'Sissy Squat', equipment: 'Peso corporal', note: 'Inclinação para trás.' },
    { name: 'Agachamento Sumô', equipment: 'Peso corporal', note: 'Pés bem abertos. Glúteo e adutores.' },
    { name: 'Jump Squat', equipment: 'Peso corporal', note: 'Salto ao subir.' },
  ],

  Isquiotibiais: [
    { name: 'Terra Romeno', equipment: 'Barra', note: 'Barra roça a perna. Coluna neutra.' },
    { name: 'Terra Romeno Halter', equipment: 'Halter', note: 'Descida controlada.' },
    { name: 'Terra Romeno Uma Perna', equipment: 'Halter', note: 'Equilíbrio e força unilateral.' },
    { name: 'Mesa Flexora', equipment: 'Máquina', note: 'Contração completa. Descida lenta 3s.' },
    { name: 'Mesa Flexora em Pé', equipment: 'Máquina', note: 'Uma perna por vez.' },
    { name: 'Stiff Uma Perna', equipment: 'Peso corporal', note: 'Equilíbrio numa perna.' },
    { name: 'Stiff com Halter', equipment: 'Halter', note: 'Joelhos levemente flexionados.' },
    { name: 'Nordic Curl', equipment: 'Peso corporal', note: 'De joelhos, descer devagar. Avançado.' },
    { name: 'Good Morning', equipment: 'Barra', note: 'Flexão de quadril com barra nas costas.' },
  ],

  Glúteo: [
    { name: 'Hip Thrust', equipment: 'Barra', note: 'Pausa de 2s na contração máxima.' },
    { name: 'Hip Thrust com Halter', equipment: 'Halter', note: 'Costas apoiadas no banco.' },
    { name: 'Hip Thrust no Chão', equipment: 'Peso corporal', note: 'Costas no chão, pés apoiados.' },
    { name: 'Hip Thrust Uma Perna', equipment: 'Peso corporal', note: 'Pé de apoio no chão.' },
    { name: 'Cadeira Abdutora', equipment: 'Máquina', note: 'Pés paralelos. Glúteo médio.' },
    { name: 'Afundo com Barra', equipment: 'Barra', note: 'Passo largo.' },
    { name: 'Afundo Reverso', equipment: 'Peso corporal', note: 'Passo para trás.' },
    { name: 'Ponte Glúteo', equipment: 'Peso corporal', note: 'Elevar quadril do chão.' },
    { name: 'Glute Kickback', equipment: 'Máquina/Elástico', note: 'Extensão de quadril em 4 apoios.' },
    { name: 'Abdução com Elástico', equipment: 'Elástico', note: 'Caminhar lateral com banda.' },
    { name: 'Agachamento Sumô', equipment: 'Barra/Halter', note: 'Pés abertos. Glúteo e adutores.' },
  ],

  Panturrilha: [
    { name: 'Panturrilha em Pé', equipment: 'Máquina', note: 'Amplitude máxima. Pausa no estiramento.' },
    { name: 'Panturrilha Sentada', equipment: 'Máquina', note: 'Sóleo. Peso moderado.' },
    { name: 'Panturrilha Sentado', equipment: 'Halter', note: 'Halter no joelho.' },
    { name: 'Panturrilha Leg Press', equipment: 'Leg Press', note: 'Extensão de tornozelo.' },
    { name: 'Panturrilha em Pé Unilateral', equipment: 'Peso corporal', note: 'Uma perna por vez.' },
    { name: 'Panturrilha Degrau', equipment: 'Degrau', note: 'Amplitude total na borda do degrau.' },
  ],

  Abdômen: [
    { name: 'Prancha', equipment: 'Peso corporal', note: 'Corpo reto como tábua.' },
    { name: 'Prancha Lateral', equipment: 'Peso corporal', note: 'Core oblíquo.' },
    { name: 'Abdominal Crunch', equipment: 'Peso corporal', note: 'Elevação do tronco.' },
    { name: 'Abdominal Bicicleta', equipment: 'Peso corporal', note: 'Alternando cotovelo e joelho.' },
    { name: 'L-Sit', equipment: 'Paralelas', note: 'Pernas em L. Core e flexores.' },
    { name: 'L-Sit Hold', equipment: 'Paralelas', note: 'Segurar posição L.' },
    { name: 'Dragon Flag', equipment: 'Barra', note: 'Segurar barra, corpo reto ao descer.' },
    { name: 'Toes to Bar', equipment: 'Barra fixa', note: 'Balançar pernas até tocar a barra.' },
    { name: 'Hanging Leg Raise', equipment: 'Barra fixa', note: 'Elevar pernas na barra.' },
    { name: 'Russian Twist', equipment: 'Peso corporal/KB', note: 'Rotação de tronco.' },
    { name: 'Mountain Climber', equipment: 'Peso corporal', note: 'Alternando pernas rapidamente.' },
    { name: 'Dead Bug', equipment: 'Peso corporal', note: 'Braços e pernas opostos.' },
  ],

  Lombar: [
    { name: 'Superman', equipment: 'Peso corporal', note: 'Deitado de bruços. Braços e pernas elevados.' },
    { name: 'Terra Convencional', equipment: 'Barra', note: 'Cadeia posterior.' },
    { name: 'Terra Romeno', equipment: 'Barra', note: 'Isquiotibiais e lombar.' },
    { name: 'Hiperextensão Lombar', equipment: 'Máquina', note: 'Banco de hiperextensão.' },
    { name: 'Bom Dia', equipment: 'Barra', note: 'Flexão de quadril com barra.' },
    { name: 'Remada Curvada', equipment: 'Barra', note: 'Também trabalha lombar.' },
  ],
}

// Lista flat de todos os exercícios para busca rápida
export function getAllExercises() {
  return MUSCLE_GROUPS.flatMap(muscle =>
    (EXERCISES_BY_MUSCLE[muscle] || []).map(ex => ({ ...ex, muscle }))
  )
}

// Buscar exercícios por músculo e texto
export function searchExercises(muscleFilter, text = '') {
  const muscles = muscleFilter ? [muscleFilter] : MUSCLE_GROUPS
  const textLower = (text || '').toLowerCase()
  const results = []
  for (const m of muscles) {
    const list = EXERCISES_BY_MUSCLE[m] || []
    for (const ex of list) {
      if (!textLower || ex.name.toLowerCase().includes(textLower)) {
        results.push({ ...ex, muscle: m })
      }
    }
  }
  return results
}
