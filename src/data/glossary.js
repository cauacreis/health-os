// Termos técnicos com explicações simples
export const GLOSSARY = {
  // Metabolismo
  'TMB':          { full: 'Taxa Metabólica Basal', desc: 'Quantidade mínima de calorias que seu corpo precisa por dia só para funcionar em repouso — respirar, coração bater, órgãos funcionando. É como o "consumo em standby" do seu corpo.' },
  'TDEE':         { full: 'Total Daily Energy Expenditure', desc: 'Total de calorias que você gasta em um dia inteiro, incluindo exercícios e atividades. É a sua TMB multiplicada pelo nível de atividade. Comer menos que isso = emagrecer.' },
  'TMB (balança)':{ full: 'Taxa Metabólica Basal medida pela balança', desc: 'Estimativa do seu metabolismo basal feita pela balança de bioimpedância. Pode ser mais precisa que as fórmulas matemáticas pois leva em conta sua composição corporal.' },
  'IMC':          { full: 'Índice de Massa Corporal', desc: 'Cálculo simples: peso ÷ (altura × altura). Indica se você está abaixo, no peso ideal ou acima. Tem limitações — não diferencia músculo de gordura, por isso a bioimpedância é mais completa.' },
  'Déficit calórico': { full: 'Déficit Calórico', desc: 'Quando você come MENOS calorias do que gasta. Ex: TDEE = 2500 kcal, você come 2000 kcal → déficit de 500 kcal. Resultado: emagrecimento.' },
  'Superávit calórico': { full: 'Superávit Calórico', desc: 'Quando você come MAIS calorias do que gasta. Necessário para ganhar massa muscular. Um superávit de 200–400 kcal/dia é o ideal para ganho limpo.' },

  // Treino
  'RIR':          { full: 'Reps in Reserve (Repetições na Reserva)', desc: 'Quantas repetições você ainda conseguiria fazer antes de falhar. RIR 2 = parou com 2 reps sobrando. Usado para controlar intensidade sem ir até a falha toda série.' },
  'Dropset':      { full: 'Dropset (Série em Queda)', desc: 'Técnica onde você reduz o peso imediatamente sem descanso e continua as repetições. Ex: rosca com 20kg até falhar, reduz para 12kg, continua até falhar. Aumenta volume e estresse metabólico.' },
  'Rest-pause':   { full: 'Rest-Pause (Pausa e Continua)', desc: 'Faz repetições até quase falhar, descansa 10–15 segundos, e continua com o mesmo peso. Permite mais volume com carga alta. Técnica avançada de intensidade.' },
  'Myo-reps':     { full: 'Myo-reps', desc: 'Faz uma série de ativação (15–20 reps), descansa 3–5 respirações, faz 3–5 reps, repete. Muito eficiente para ganho muscular com menos tempo de treino.' },
  'Cluster':      { full: 'Cluster Set', desc: 'Pequenas pausas de 10–20 segundos dentro da própria série. Permite usar carga mais pesada por mais repetições. Ex: 3 reps + pausa + 3 reps + pausa + 3 reps = 1 cluster de 9 reps.' },
  'HIIT':         { full: 'High Intensity Interval Training', desc: 'Treino com alternância de esforço máximo e recuperação. Ex: 30s correndo no limite + 90s caminhando. Eficiente para queimar gordura e melhorar condicionamento em pouco tempo.' },
  'DOMS':         { full: 'Delayed Onset Muscle Soreness', desc: 'Aquela dor muscular que aparece 24–48 horas após o treino. É causada por microlesões nas fibras musculares — sinal de que o estímulo foi suficiente. Não é obrigatória para crescer.' },

  // Cardio / Frequência Cardíaca
  'FC Máx':       { full: 'Frequência Cardíaca Máxima', desc: 'Máximo de batimentos por minuto que seu coração aguenta. Estimativa: 220 menos sua idade. Usada como base para calcular as zonas de treino cardio.' },
  'Z1':           { full: 'Zona 1 — Recuperação Ativa', desc: '50–60% da FC máx. Ritmo levíssimo, você consegue cantar. Usada para recuperação entre treinos intensos. Ex: caminhada tranquila.' },
  'Z2':           { full: 'Zona 2 — Aeróbico Leve', desc: '60–70% da FC máx. Você consegue conversar com frases completas. A zona de maior queima de gordura. Ideal para cardio base e longevidade.' },
  'Z3':           { full: 'Zona 3 — Aeróbico Moderado', desc: '70–80% da FC máx. Conversa difícil, frases curtas. Melhora eficiência cardiovascular. Corrida em ritmo confortável mas desafiador.' },
  'Z4':           { full: 'Zona 4 — Limiar Anaeróbico', desc: '80–90% da FC máx. Difícil falar, respiração pesada. Aumenta velocidade e capacidade de manter esforço alto. Treino de tempo/fartlek.' },
  'Z5':           { full: 'Zona 5 — Máximo', desc: '90–100% da FC máx. Impossível falar, esforço total. Usado em sprints curtos. Melhora potência e VO2 máx. Não sustentável por mais de 1–2 minutos.' },
  'VO2 Máx':      { full: 'Volume Máximo de Oxigênio', desc: 'Maior quantidade de oxigênio que seu corpo consegue usar durante exercício máximo. Quanto mais alto, melhor seu condicionamento aeróbico. Melhora com treino Z2 e Z4.' },

  // Bioimpedância
  'Gordura Visceral': { full: 'Gordura Visceral', desc: 'Gordura que fica em volta dos órgãos internos (fígado, intestinos). Diferente da gordura subcutânea (que você aperta na barriga). Nível acima de 12 é preocupante para a saúde.' },
  'Gordura Corporal': { full: '% de Gordura Corporal', desc: 'Porcentagem do seu peso que é gordura. Saudável: homens 10–20%, mulheres 18–28%. Atletas ficam abaixo disso. Medido pela bioimpedância ou dobras cutâneas.' },
  'Massa Muscular':   { full: '% de Massa Muscular', desc: 'Porcentagem do peso que é músculo esquelético (os que você treina). Homens: média 40–50%. Mulheres: 30–40%. Aumenta com treino de resistência e proteína suficiente.' },
  'Idade Metabólica': { full: 'Idade Metabólica', desc: 'Comparação do seu metabolismo basal com a média da população por faixa etária. Idade metabólica menor que a real = ótimo sinal de saúde. Melhora com exercício e alimentação.' },
  'Água Corporal':    { full: '% de Água Corporal', desc: 'Porcentagem do peso que é água. Normal: 45–65%. Homens têm mais que mulheres pois têm mais músculo (músculo é ~75% água). Baixo indica desidratação crônica.' },

  // Nutrição
  'Proteína':     { full: 'Proteína', desc: 'Macronutriente essencial para construir e reparar músculos. Meta para treino: 1.8–2.5g por kg de peso corporal por dia. Fontes: frango, ovo, carne, whey, feijão.' },
  'Carboidrato':  { full: 'Carboidrato', desc: 'Principal fonte de energia do corpo, especialmente para treinos intensos. Não é vilão — o excesso é. Prefira fontes complexas: arroz, batata doce, aveia, frutas.' },
  'Gordura':      { full: 'Gordura (Lipídeo)', desc: 'Essencial para produção de hormônios (incluindo testosterona), absorção de vitaminas e saúde cerebral. Meta: 20–35% das calorias totais. Fontes: azeite, abacate, castanhas, ovos.' },
  'Kcal':         { full: 'Quilocaloria (caloria popular)', desc: 'Unidade de energia dos alimentos. O que chamamos de "caloria" no dia a dia é na verdade quilocaloria (kcal). 1g proteína = 4 kcal, 1g carbo = 4 kcal, 1g gordura = 9 kcal.' },
  'Macros':       { full: 'Macronutrientes', desc: 'Os três nutrientes que fornecem energia: proteína, carboidrato e gordura. Controlar macros é mais eficiente que só contar calorias, pois cada um tem função diferente no corpo.' },
}
