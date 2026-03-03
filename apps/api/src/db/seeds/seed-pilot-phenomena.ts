/**
 * Seed pilot phenomenon proposals.
 *
 * Generates 3 phenomenon proposals per student via the API batch endpoint,
 * then approves all pending proposals. Requires the API to be running.
 *
 * Usage:
 *   npx tsx apps/api/src/db/seeds/seed-pilot-phenomena.ts
 *
 * Alternatively, if the API is not running, this script can directly insert
 * pre-crafted pilot proposals into the database.
 */
import 'dotenv/config';
import { db } from '../index';
import { students, phenomenonProposals, standards } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

const PILOT_PHENOMENA = [
  // ── Ana (age 5, grade 1) ──
  {
    studentName: 'Ana',
    proposals: [
      {
        title: '¿Por qué cambian de color las hojas?',
        description:
          'Exploración sobre los cambios estacionales en las plantas del jardín. Ana observará hojas de diferentes colores y tamaños.',
        duration_days: 3,
        linked_standards: ['SEP-Ciencias-1-1.1'],
        facilitation_guide: {
          overview:
            'Guía al niño a observar y comparar hojas de diferentes plantas, notando patrones de color y textura.',
          duration_days: 3,
          daily_steps: [
            {
              day: 1,
              title: 'Colección de hojas',
              instructions:
                'Salgan al jardín o parque cercano. Recojan 5-8 hojas de diferentes plantas. Agrúpenlas por color.',
              discussion_prompts: [
                '¿Cuántos colores diferentes ves?',
                '¿Cuáles hojas son más grandes?',
              ],
            },
            {
              day: 2,
              title: 'Observación con lupa',
              instructions:
                'Usen una lupa para observar las venas y texturas de las hojas. Dibujen lo que ven.',
              discussion_prompts: [
                '¿Qué ves dentro de la hoja?',
                '¿Todas las hojas se sienten igual?',
              ],
            },
            {
              day: 3,
              title: 'Mural de hojas',
              instructions:
                'Peguen las hojas en un papel grande creando un mural. El niño explica qué aprendió sobre cada hoja.',
              discussion_prompts: [
                '¿Cuál hoja te gustó más y por qué?',
                '¿Por qué crees que las hojas son de diferentes colores?',
              ],
            },
          ],
          materials_needed: [
            'Hojas de plantas',
            'Lupa',
            'Papel grande',
            'Pegamento',
            'Colores',
          ],
          success_indicators: [
            'El niño puede agrupar hojas por al menos 2 características',
            'El niño usa vocabulario descriptivo (grande, pequeño, verde, seco)',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tu mural de hojas y cuéntame cuál es tu hoja favorita.',
          tts_text:
            'Toma una foto de tu mural de hojas y cuéntame cuál es tu hoja favorita.',
          capture_type: 'both' as const,
        },
      },
      {
        title: '¿Cuántas patas tienen los animales?',
        description:
          'Investigación sobre las diferencias entre animales según el número de patas. Ana clasificará animales de su entorno.',
        duration_days: 3,
        linked_standards: ['SEP-Ciencias-1-1.2'],
        facilitation_guide: {
          overview:
            'Guía al niño a observar y clasificar animales por número de patas, desarrollando habilidades de observación y conteo.',
          duration_days: 3,
          daily_steps: [
            {
              day: 1,
              title: 'Cacería de animales',
              instructions:
                'Busquen animales en el jardín, libros o imágenes. Anoten cuántas patas tiene cada uno.',
              discussion_prompts: [
                '¿Cuántas patas tiene un perro?',
                '¿Conoces un animal sin patas?',
              ],
            },
            {
              day: 2,
              title: 'Grupos de patas',
              instructions:
                'Dibujen animales y agrúpenlos: 0 patas, 2 patas, 4 patas, 6 patas, 8 patas.',
              discussion_prompts: [
                '¿Qué grupo tiene más animales?',
                '¿Por qué algunos animales tienen muchas patas?',
              ],
            },
            {
              day: 3,
              title: 'Mi animal favorito',
              instructions:
                'El niño escoge su animal favorito y cuenta todo lo que aprendió sobre él.',
              discussion_prompts: [
                '¿Cuántas patas tiene tu animal favorito?',
                '¿Qué comen los animales de 4 patas?',
              ],
            },
          ],
          materials_needed: [
            'Lápices de colores',
            'Papel',
            'Libros o revistas con animales',
          ],
          success_indicators: [
            'El niño clasifica correctamente al menos 5 animales por patas',
            'El niño cuenta las patas correctamente',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Dibuja tu animal favorito y dime cuántas patas tiene.',
          tts_text:
            'Dibuja tu animal favorito y dime cuántas patas tiene.',
          capture_type: 'photo' as const,
        },
      },
      {
        title: '¿De qué color es el agua?',
        description:
          'Experimento con mezclas de colores usando agua y colorante vegetal. Ana descubrirá los colores primarios y secundarios.',
        duration_days: 4,
        linked_standards: ['SEP-Ciencias-1-1.3'],
        facilitation_guide: {
          overview:
            'Guía al niño en un experimento de mezcla de colores con agua, explorando colores primarios y secundarios.',
          duration_days: 4,
          daily_steps: [
            {
              day: 1,
              title: 'Los tres colores mágicos',
              instructions:
                'Preparen 3 vasos con agua y agreguen colorante rojo, azul y amarillo. El niño observa los colores.',
              discussion_prompts: [
                '¿Cómo se llaman estos colores?',
                '¿Qué pasará si los mezclamos?',
              ],
            },
            {
              day: 2,
              title: 'Mezcla mágica',
              instructions:
                'Mezclen rojo + azul, azul + amarillo, rojo + amarillo en nuevos vasos. ¡Nuevos colores!',
              discussion_prompts: [
                '¿Qué color salió al mezclar rojo y azul?',
                '¿Puedes adivinar qué color saldrá?',
              ],
            },
            {
              day: 3,
              title: 'Pintura con agua de colores',
              instructions:
                'Usen el agua de colores para pintar en papel absorbente. Observen cómo se mezclan.',
              discussion_prompts: [
                '¿Los colores se mezclan solos en el papel?',
                '¿Cuántos colores diferentes creaste?',
              ],
            },
            {
              day: 4,
              title: 'Arcoíris casero',
              instructions:
                'Ordenen todos los colores del más claro al más oscuro. Creen su propio arcoíris.',
              discussion_prompts: [
                '¿Cuántos colores tiene tu arcoíris?',
                '¿Cuál es tu color favorito?',
              ],
            },
          ],
          materials_needed: [
            'Vasos transparentes',
            'Agua',
            'Colorante vegetal (rojo, azul, amarillo)',
            'Papel absorbente',
          ],
          success_indicators: [
            'El niño predice correctamente al menos 1 mezcla de colores',
            'El niño nombra los colores primarios y al menos 2 secundarios',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tus vasos de colores y dime cuáles colores mezclaste.',
          tts_text:
            'Toma una foto de tus vasos de colores y dime cuáles colores mezclaste.',
          capture_type: 'both' as const,
        },
      },
    ],
  },
  // ── Miguel (age 8, grade 3) ──
  {
    studentName: 'Miguel',
    proposals: [
      {
        title: '¿Por qué vuelan los aviones de papel?',
        description:
          'Investigación sobre aerodinámica básica construyendo diferentes modelos de aviones de papel y midiendo distancias de vuelo.',
        duration_days: 4,
        linked_standards: ['SEP-Ciencias-3-1.1'],
        facilitation_guide: {
          overview:
            'Guía al niño en un proyecto de ingeniería donde construye y prueba aviones de papel, introduciendo conceptos de fuerza y movimiento.',
          duration_days: 4,
          daily_steps: [
            {
              day: 1,
              title: 'Diseño del primer avión',
              instructions:
                'Construyan un avión de papel básico. Lancen 5 veces y midan la distancia con una cinta métrica.',
              discussion_prompts: [
                '¿Qué tan lejos voló?',
                '¿Siempre vuela la misma distancia?',
              ],
            },
            {
              day: 2,
              title: 'Avión mejorado',
              instructions:
                'Modifiquen el diseño: alas más anchas o más angostas. Comparen con el primer avión.',
              discussion_prompts: [
                '¿Cuál avión voló más lejos?',
                '¿Por qué crees que uno vuela mejor?',
              ],
            },
            {
              day: 3,
              title: 'Tabla de resultados',
              instructions:
                'Creen una tabla con los resultados de cada avión. Grafiquen las distancias.',
              discussion_prompts: [
                '¿Qué avión ganó?',
                '¿Qué tienen en común los aviones que vuelan lejos?',
              ],
            },
            {
              day: 4,
              title: 'El mejor avión',
              instructions:
                'Diseñen el "avión perfecto" usando lo que aprendieron. Competencia final de vuelo.',
              discussion_prompts: [
                '¿Qué aprendiste sobre el vuelo?',
                '¿Qué harías diferente la próxima vez?',
              ],
            },
          ],
          materials_needed: [
            'Hojas de papel',
            'Cinta métrica',
            'Cuaderno para registro',
            'Lápiz',
          ],
          success_indicators: [
            'El niño registra datos en una tabla',
            'El niño identifica al menos 1 variable que afecta el vuelo',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tu tabla de resultados y explica cuál avión voló más lejos y por qué.',
          tts_text:
            'Toma una foto de tu tabla de resultados y explica cuál avión voló más lejos y por qué.',
          capture_type: 'both' as const,
        },
      },
      {
        title: '¿Cuánto mide un dinosaurio?',
        description:
          'Proyecto de medición donde Miguel usa su cuerpo y objetos cotidianos como unidades de medida para estimar el tamaño de dinosaurios.',
        duration_days: 3,
        linked_standards: ['SEP-Matematicas-3-1.1'],
        facilitation_guide: {
          overview:
            'Conecta el interés del niño por los dinosaurios con conceptos de medición y comparación de longitudes.',
          duration_days: 3,
          daily_steps: [
            {
              day: 1,
              title: 'Mi cuerpo como medida',
              instructions:
                'Midan cosas del hogar usando pasos, manos y brazos. Registren en una tabla.',
              discussion_prompts: [
                '¿Cuántos pasos mide tu cuarto?',
                '¿Cuántas manos mide la mesa?',
              ],
            },
            {
              day: 2,
              title: 'Tamaño de dinosaurios',
              instructions:
                'Investiguen cuánto medían 3 dinosaurios (T-Rex: 12m, Braquiosaurio: 25m, Velociraptor: 2m). Marquen las distancias en el patio.',
              discussion_prompts: [
                '¿Cuántos pasos tuyos mide un T-Rex?',
                '¿Cabe un Braquiosaurio en tu casa?',
              ],
            },
            {
              day: 3,
              title: 'Mapa de dinosaurios',
              instructions:
                'Dibujen un mapa a escala del patio con los dinosaurios dibujados al tamaño correcto.',
              discussion_prompts: [
                '¿Cuál dinosaurio es más grande que tu casa?',
                '¿Cuántos Velociraptores caben en un T-Rex?',
              ],
            },
          ],
          materials_needed: [
            'Cinta métrica',
            'Gis o cuerda',
            'Papel cuadriculado',
            'Colores',
          ],
          success_indicators: [
            'El niño convierte entre unidades no convencionales y metros',
            'El niño compara correctamente tamaños de 3 dinosaurios',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de las marcas de dinosaurios en el patio y dime cuántos pasos mide el T-Rex.',
          tts_text:
            'Toma una foto de las marcas de dinosaurios en el patio y dime cuántos pasos mide el T-Rex.',
          capture_type: 'both' as const,
        },
      },
      {
        title: '¿Cómo se mueven los planetas?',
        description:
          'Construcción de un modelo del sistema solar con materiales reciclados. Miguel aprenderá sobre órbitas y distancias relativas.',
        duration_days: 5,
        linked_standards: ['SEP-Ciencias-3-1.2'],
        facilitation_guide: {
          overview:
            'Conecta el interés del niño por el espacio con conceptos de escala, distancia y movimiento orbital.',
          duration_days: 5,
          daily_steps: [
            {
              day: 1,
              title: 'Los 8 planetas',
              instructions:
                'Investiguen los 8 planetas. Escriban su nombre, tamaño relativo y distancia al Sol.',
              discussion_prompts: [
                '¿Cuál es el planeta más grande?',
                '¿Cuál está más cerca del Sol?',
              ],
            },
            {
              day: 2,
              title: 'Selección de materiales',
              instructions:
                'Busquen objetos redondos de diferentes tamaños para representar los planetas (pelotas, canicas, frutas).',
              discussion_prompts: [
                '¿Qué objeto se parece a Júpiter?',
                '¿Y para Mercurio?',
              ],
            },
            {
              day: 3,
              title: 'Construir el modelo',
              instructions:
                'Armen el sistema solar en el piso del cuarto. Usen hilo para las órbitas.',
              discussion_prompts: [
                '¿Por qué los planetas de afuera están más lejos?',
                '¿Cuánto tardan en dar la vuelta al Sol?',
              ],
            },
            {
              day: 4,
              title: 'Los planetas se mueven',
              instructions:
                'Simulen el movimiento orbital. Cada persona mueve un planeta alrededor del Sol.',
              discussion_prompts: [
                '¿Cuál planeta se mueve más rápido?',
                '¿Se chocan los planetas?',
              ],
            },
            {
              day: 5,
              title: 'Presentación espacial',
              instructions:
                'Miguel presenta su sistema solar explicando cada planeta.',
              discussion_prompts: [
                '¿Qué planeta te gustaría visitar?',
                '¿Qué aprendiste que no sabías antes?',
              ],
            },
          ],
          materials_needed: [
            'Pelotas de diferentes tamaños',
            'Hilo o cuerda',
            'Pinturas',
            'Cartulina para etiquetas',
          ],
          success_indicators: [
            'El niño nombra los 8 planetas en orden',
            'El niño explica que los planetas giran alrededor del Sol',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tu sistema solar y nombra los planetas que puedas.',
          tts_text:
            'Toma una foto de tu sistema solar y nombra los planetas que puedas.',
          capture_type: 'both' as const,
        },
      },
    ],
  },
  // ── Sofia (age 11, grade 5) ──
  {
    studentName: 'Sofia',
    proposals: [
      {
        title: '¿Cómo funciona un ecosistema en miniatura?',
        description:
          'Construcción de un terrario cerrado para observar ciclos de agua, fotosíntesis y descomposición durante una semana.',
        duration_days: 5,
        linked_standards: ['SEP-Ciencias-5-1.1'],
        facilitation_guide: {
          overview:
            'Guía al estudiante en la construcción de un ecosistema cerrado, observando procesos naturales como evaporación, condensación y crecimiento vegetal.',
          duration_days: 5,
          daily_steps: [
            {
              day: 1,
              title: 'Diseño del terrario',
              instructions:
                'Investiguen qué necesita un ecosistema: plantas, tierra, agua, luz. Diseñen el terrario en papel.',
              discussion_prompts: [
                '¿Qué necesitan las plantas para vivir?',
                '¿Por qué el frasco debe estar cerrado?',
              ],
            },
            {
              day: 2,
              title: 'Construcción',
              instructions:
                'Coloquen capas: piedras, carbón, tierra, musgo, plantas pequeñas. Agreguen agua y cierren.',
              discussion_prompts: [
                '¿Para qué sirve la capa de piedras?',
                '¿Cuánta agua necesitamos?',
              ],
            },
            {
              day: 3,
              title: 'Primera observación',
              instructions:
                'Observen el terrario. ¿Hay gotas en las paredes? Registren temperatura, humedad visible, estado de plantas.',
              discussion_prompts: [
                '¿De dónde vienen las gotas?',
                '¿Es como la lluvia?',
              ],
            },
            {
              day: 4,
              title: 'Registro científico',
              instructions:
                'Creen un diario científico con observaciones, dibujos y mediciones. Comparen con el día anterior.',
              discussion_prompts: [
                '¿Qué cambió desde ayer?',
                '¿Las plantas se ven diferentes?',
              ],
            },
            {
              day: 5,
              title: 'Conclusiones',
              instructions:
                'Resuman los ciclos observados: agua, luz, crecimiento. Presenten el terrario con su diario.',
              discussion_prompts: [
                '¿El terrario podría sobrevivir para siempre?',
                '¿Qué pasa si no le da luz?',
              ],
            },
          ],
          materials_needed: [
            'Frasco de vidrio grande con tapa',
            'Piedras pequeñas',
            'Carbón activado',
            'Tierra para macetas',
            'Plantas pequeñas (musgo, helechos)',
            'Agua',
          ],
          success_indicators: [
            'El estudiante identifica el ciclo del agua dentro del terrario',
            'El estudiante mantiene un diario científico con al menos 3 observaciones',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tu terrario y graba un audio explicando los ciclos que observaste.',
          tts_text:
            'Toma una foto de tu terrario y graba un audio explicando los ciclos que observaste.',
          capture_type: 'both' as const,
        },
      },
      {
        title: '¿El arte puede usar matemáticas?',
        description:
          'Exploración de patrones geométricos y simetría a través del arte: teselaciones, fractales simples y proporciones en el dibujo.',
        duration_days: 4,
        linked_standards: ['SEP-Matematicas-5-1.1'],
        facilitation_guide: {
          overview:
            'Conecta el interés del estudiante por el arte con conceptos de geometría: simetría, traslación, rotación y patrones repetitivos.',
          duration_days: 4,
          daily_steps: [
            {
              day: 1,
              title: 'Simetría en la naturaleza',
              instructions:
                'Busquen ejemplos de simetría: hojas, mariposas, rostros. Dibujen la línea de simetría.',
              discussion_prompts: [
                '¿Qué es una línea de simetría?',
                '¿Tu cara es perfectamente simétrica?',
              ],
            },
            {
              day: 2,
              title: 'Teselaciones',
              instructions:
                'Creen un patrón que cubra una superficie sin dejar huecos (como azulejos). Usen triángulos o hexágonos.',
              discussion_prompts: [
                '¿Qué formas encajan sin dejar espacios?',
                '¿Dónde ves teselaciones en la vida real?',
              ],
            },
            {
              day: 3,
              title: 'Arte geométrico',
              instructions:
                'Creen una obra de arte usando solo figuras geométricas. Apliquen colores siguiendo un patrón.',
              discussion_prompts: [
                '¿Cuántas figuras diferentes usaste?',
                '¿Qué regla seguiste para los colores?',
              ],
            },
            {
              day: 4,
              title: 'Galería matemática',
              instructions:
                'Presenten su arte geométrico explicando las matemáticas detrás: tipos de simetría, transformaciones usadas.',
              discussion_prompts: [
                '¿Las matemáticas pueden ser bonitas?',
                '¿Qué artistas famosos usaron geometría?',
              ],
            },
          ],
          materials_needed: [
            'Regla y compás',
            'Papel cuadriculado',
            'Colores y marcadores',
            'Tijeras',
            'Cartulina',
          ],
          success_indicators: [
            'El estudiante crea una teselación correcta con al menos 2 figuras',
            'El estudiante identifica y nombra tipos de simetría',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tu arte geométrico y explica qué tipos de simetría usaste.',
          tts_text:
            'Toma una foto de tu arte geométrico y explica qué tipos de simetría usaste.',
          capture_type: 'both' as const,
        },
      },
      {
        title: '¿Cómo funciona una app?',
        description:
          'Diseño de una app imaginaria en papel: wireframes, flujo de usuario y lógica básica. Conecta tecnología con pensamiento computacional.',
        duration_days: 4,
        linked_standards: ['SEP-Matematicas-5-1.2'],
        facilitation_guide: {
          overview:
            'Guía al estudiante a pensar como diseñador de tecnología: planificar, diseñar interfaces y describir la lógica paso a paso.',
          duration_days: 4,
          daily_steps: [
            {
              day: 1,
              title: '¿Qué problema resuelve?',
              instructions:
                'Piensen en un problema cotidiano. Describan cómo una app podría resolverlo. Hagan una lista de funciones.',
              discussion_prompts: [
                '¿Qué problema quieres resolver?',
                '¿Quién usaría tu app?',
              ],
            },
            {
              day: 2,
              title: 'Pantallas de la app',
              instructions:
                'Dibujen cada pantalla de la app en hojas separadas. Incluyan botones, texto y menús.',
              discussion_prompts: [
                '¿Qué pasa cuando tocas este botón?',
                '¿Cómo navega el usuario entre pantallas?',
              ],
            },
            {
              day: 3,
              title: 'Diagrama de flujo',
              instructions:
                'Creen un diagrama de flujo: inicio → decisiones → acciones → resultado. Usen flechas y formas.',
              discussion_prompts: [
                '¿Qué pasa si el usuario dice "no"?',
                '¿Hay pasos que se repiten?',
              ],
            },
            {
              day: 4,
              title: 'Presentación del proyecto',
              instructions:
                'Presenten la app completa: problema, pantallas, flujo. Expliquen por qué cada decisión de diseño.',
              discussion_prompts: [
                '¿Qué fue lo más difícil de diseñar?',
                '¿Cambiarías algo de tu diseño?',
              ],
            },
          ],
          materials_needed: [
            'Hojas blancas',
            'Lápices de colores',
            'Notas adhesivas',
            'Regla',
          ],
          success_indicators: [
            'El estudiante crea al menos 4 wireframes conectados',
            'El estudiante hace un diagrama de flujo con al menos 2 decisiones',
          ],
        },
        evidence_prompt: {
          instruction_text:
            'Toma una foto de tus wireframes y explica cómo funciona tu app.',
          tts_text:
            'Toma una foto de tus wireframes y explica cómo funciona tu app.',
          capture_type: 'both' as const,
        },
      },
    ],
  },
];

async function seed() {
  console.log('Seeding pilot phenomenon proposals...\n');

  for (const { studentName, proposals } of PILOT_PHENOMENA) {
    // Find student by name
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.name, studentName))
      .limit(1);

    if (!student) {
      console.log(`⚠ Student "${studentName}" not found — skipping`);
      continue;
    }

    // Find valid standard IDs for linking
    const allLinkedIds = proposals.flatMap((p) => p.linked_standards);
    const validStandards = await db
      .select({ id: standards.id })
      .from(standards)
      .where(inArray(standards.id, allLinkedIds));
    const validIds = new Set(validStandards.map((s) => s.id));

    for (const proposal of proposals) {
      // Filter linked_standards to only those that exist in DB
      const linkedStandards = proposal.linked_standards.filter((id) =>
        validIds.has(id),
      );

      // Check if a proposal with the same title already exists for this student
      const [existing] = await db
        .select({ id: phenomenonProposals.id })
        .from(phenomenonProposals)
        .where(
          and(
            eq(phenomenonProposals.studentId, student.id),
            eq(phenomenonProposals.title, proposal.title),
          ),
        )
        .limit(1);

      if (existing) {
        console.log(
          `  ✓ "${proposal.title}" already exists for ${studentName}`,
        );
        continue;
      }

      const [saved] = await db
        .insert(phenomenonProposals)
        .values({
          studentId: student.id,
          linkedStandards: linkedStandards.length > 0 ? linkedStandards : proposal.linked_standards,
          title: proposal.title,
          facilitationGuide: JSON.stringify(proposal.facilitation_guide),
          evidencePrompt: JSON.stringify(proposal.evidence_prompt),
          materialsNeeded: proposal.facilitation_guide.materials_needed,
          status: 'approved',
          approvedBy: 'pilot-seed',
          approvedAt: new Date(),
        })
        .returning({ id: phenomenonProposals.id });

      console.log(
        `  ✓ Created & approved "${proposal.title}" for ${studentName} (${saved.id})`,
      );
    }

    console.log(`  ${studentName}: ${proposals.length} proposals seeded\n`);
  }

  console.log('Done seeding pilot phenomena.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
