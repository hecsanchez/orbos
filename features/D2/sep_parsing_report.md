# SEP Standards Parsing Report

## Source Documents

- Programa Sintético Fase 3 (Grades 1-2)
- Programa Sintético Fase 4 (Grades 3-4)
- Programa Sintético Fase 5 (Grades 5-6)
- Secretaría de Educación Pública (SEP), 2024 edition

## Extraction Methodology

1. PDFs converted to text using `pdftotext -layout`
2. 'Contenidos y Procesos de desarrollo de aprendizaje' tables extracted for:
   - **Lenguajes** → mapped to subject 'Español'
   - **Saberes y Pensamiento Científico** → split into 'Matemáticas' and 'Ciencias Naturales'
3. Each 'Contenido' (content topic) per grade = one standard
4. Multiple 'Procesos de desarrollo de aprendizaje' bullet points within the same
   Contenido+grade were concatenated into a single description

## Standards Count by Subject and Grade

| Subject | G1 | G2 | G3 | G4 | G5 | G6 | Total |
|---------|----|----|----|----|----|----|-------|
| Matemáticas | 7 | 8 | 8 | 8 | 11 | 10 | 52 |
| Español | 26 | 26 | 25 | 25 | 24 | 24 | 150 |
| Ciencias Naturales | 8 | 8 | 10 | 10 | 12 | 12 | 60 |
| **Total** | 41 | 42 | 43 | 43 | 47 | 46 | **262** |

## Topics by Subject and Grade

### Matemáticas

**Grade 1** (7 standards):
- `SEP-MAT-1-1.1` — Estudio de los números
- `SEP-MAT-1-2.1` — Construcción de la noción de suma y resta, y su relación como operaciones inversas
- `SEP-MAT-1-3.1` — Cuerpos geométricos y sus características
- `SEP-MAT-1-4.1` — Figuras geométricas y sus características
- `SEP-MAT-1-5.1` — Medición de longitud, masa y capacidad
- `SEP-MAT-1-6.1` — Medición del tiempo
- `SEP-MAT-1-7.1` — Organización e interpretación de datos

**Grade 2** (8 standards):
- `SEP-MAT-2-1.1` — Estudio de los números
- `SEP-MAT-2-2.1` — Construcción de la noción de suma y resta, y su relación como operaciones inversas
- `SEP-MAT-2-3.1` — Construcción de la noción de multiplicación y división, y su relación como operaciones inversas
- `SEP-MAT-2-4.1` — Cuerpos geométricos y sus características
- `SEP-MAT-2-5.1` — Figuras geométricas y sus características
- `SEP-MAT-2-6.1` — Medición de longitud, masa y capacidad
- `SEP-MAT-2-7.1` — Medición del tiempo
- `SEP-MAT-2-8.1` — Organización e interpretación de datos

**Grade 3** (8 standards):
- `SEP-MAT-3-1.1` — Estudio de los números
- `SEP-MAT-3-2.1` — Suma y resta, su relación como operaciones inversas
- `SEP-MAT-3-3.1` — Multiplicación y división, su relación como operaciones inversas
- `SEP-MAT-3-4.1` — Cuerpos geométricos y sus características
- `SEP-MAT-3-5.1` — Figuras geométricas y sus características
- `SEP-MAT-3-6.1` — Medición de longitud, masa y capacidad
- `SEP-MAT-3-7.1` — Medición del tiempo
- `SEP-MAT-3-8.1` — Organización e interpretación de datos

**Grade 4** (8 standards):
- `SEP-MAT-4-1.1` — Estudio de los números
- `SEP-MAT-4-2.1` — Suma y resta, su relación como operaciones inversas
- `SEP-MAT-4-3.1` — Multiplicación y división, su relación como operaciones inversas
- `SEP-MAT-4-4.1` — Cuerpos geométricos y sus características
- `SEP-MAT-4-5.1` — Figuras geométricas y sus características
- `SEP-MAT-4-6.1` — Cálculo de perímetro y área
- `SEP-MAT-4-7.1` — Medición del tiempo
- `SEP-MAT-4-8.1` — Organización e interpretación de datos

**Grade 5** (11 standards):
- `SEP-MAT-5-1.1` — Estudio de los números
- `SEP-MAT-5-2.1` — Suma y resta, su relación como operaciones inversas
- `SEP-MAT-5-3.1` — Multiplicación y división, su relación como operaciones inversas
- `SEP-MAT-5-4.1` — Relaciones de proporcionalidad
- `SEP-MAT-5-5.1` — Cuerpos geométricos y sus características
- `SEP-MAT-5-6.1` — Figuras geométricas y sus características
- `SEP-MAT-5-7.1` — Ubicación espacial
- `SEP-MAT-5-8.1` — Medición de longitud, masa y capacidad
- `SEP-MAT-5-9.1` — Perímetro, área y noción de volumen
- `SEP-MAT-5-10.1` — Organización e interpretación de datos
- `SEP-MAT-5-11.1` — Nociones de probabilidad

**Grade 6** (10 standards):
- `SEP-MAT-6-1.1` — Estudio de los números
- `SEP-MAT-6-2.1` — Suma y resta, su relación como operaciones inversas
- `SEP-MAT-6-3.1` — Multiplicación y división, su relación como operaciones inversas
- `SEP-MAT-6-4.1` — Relaciones de proporcionalidad
- `SEP-MAT-6-5.1` — Cuerpos geométricos y sus características
- `SEP-MAT-6-6.1` — Figuras geométricas y sus características
- `SEP-MAT-6-7.1` — Ubicación espacial
- `SEP-MAT-6-8.1` — Perímetro, área y noción de volumen
- `SEP-MAT-6-9.1` — Organización e interpretación de datos
- `SEP-MAT-6-10.1` — Nociones de probabilidad

### Español

**Grade 1** (26 standards):
- `SEP-ESP-1-1.1` — Escritura de nombres en la lengua materna
- `SEP-ESP-1-2.1` — Lectura compartida en voz alta
- `SEP-ESP-1-3.1` — Narración de actividades y eventos relevantes que tengan lugar en la familia, la escuela o el resto de la comunidad
- `SEP-ESP-1-4.1` — Escritura colectiva por medio del dictado
- `SEP-ESP-1-5.1` — Descripción de objetos, lugares y seres vivos
- `SEP-ESP-1-6.1` — Uso de convenciones de la escritura presentes en la cotidianeidad
- `SEP-ESP-1-7.1` — Uso del dibujo y/o la escritura para recordar actividades y acuerdos escolares
- `SEP-ESP-1-8.1` — Registro y/o resumen de información consultada en fuentes orales, escritas, audiovisuales, táctiles o sonoras, para estudiar y/o exponer
- `SEP-ESP-1-9.1` — Empleo de textos con instrucciones para participar en juegos, usar o elaborar objetos, preparar alimentos u otros propósitos
- `SEP-ESP-1-10.1` — Producción e interpretación de avisos, carteles, anuncios publicitarios y letreros en la vida cotidiana
- `SEP-ESP-1-11.1` — Elaboración y difusión de notas informativas en la escuela y el resto de la comunidad
- `SEP-ESP-1-12.1` — Producción de textos dirigidos a autoridades y personas de la comunidad, en relación con necesidades, intereses o actividades escolares
- `SEP-ESP-1-13.1` — Lectura, escritura y otros tipos de interacción mediante lenguajes que ocurren en el contexto familiar
- `SEP-ESP-1-14.1` — Comunicación a distancia con familiares u otras personas
- `SEP-ESP-1-15.1` — Conversaciones o entrevistas con personas de la comunidad y otros lugares
- `SEP-ESP-1-16.1` — Reconocimiento de la diversidad lingüística y cultural en la familia, la escuela y el resto de la comunidad
- `SEP-ESP-1-17.1` — Exploración de testimonios escritos, fotográficos y audiovisuales del pasado familiar y comunitario
- `SEP-ESP-1-18.1` — Reflexión sobre los medios de comunicación
- `SEP-ESP-1-19.1` — Uso de elementos de los lenguajes artísticos en la vida cotidiana
- `SEP-ESP-1-20.1` — Uso de los lenguajes artísticos para expresar rasgos de las identidades personal y colectiva
- `SEP-ESP-1-21.1` — Intervención del entorno familiar y escolar para imaginar y realizar propuestas de mejora
- `SEP-ESP-1-22.1` — Apreciación de canciones, rondas infantiles, arrullos y cuentos
- `SEP-ESP-1-23.1` — Experimentación con elementos sonoros en composiciones literarias
- `SEP-ESP-1-24.1` — Interacción con manifestaciones culturales y artísticas
- `SEP-ESP-1-25.1` — Recreación de historias mediante el uso artístico de las palabras, del cuerpo, del espacio y del tiempo
- `SEP-ESP-1-26.1` — Representación de distintas formas de ser y estar en el mundo a partir de la ficción

**Grade 2** (26 standards):
- `SEP-ESP-2-1.1` — Escritura de nombres en la lengua materna
- `SEP-ESP-2-2.1` — Lectura compartida en voz alta
- `SEP-ESP-2-3.1` — Narración de actividades y eventos relevantes que tengan lugar en la familia, la escuela o el resto de la comunidad
- `SEP-ESP-2-4.1` — Escritura colectiva por medio del dictado
- `SEP-ESP-2-5.1` — Descripción de objetos, lugares y seres vivos
- `SEP-ESP-2-6.1` — Uso de convenciones de la escritura presentes en la cotidianeidad
- `SEP-ESP-2-7.1` — Uso del dibujo y/o la escritura para recordar actividades y acuerdos escolares
- `SEP-ESP-2-8.1` — Registro y/o resumen de información consultada en fuentes orales, escritas, audiovisuales, táctiles o sonoras, para estudiar y/o exponer
- `SEP-ESP-2-9.1` — Empleo de textos con instrucciones para participar en juegos, usar o elaborar objetos, preparar alimentos u otros propósitos
- `SEP-ESP-2-10.1` — Producción e interpretación de avisos, carteles, anuncios publicitarios y letreros en la vida cotidiana
- `SEP-ESP-2-11.1` — Elaboración y difusión de notas informativas en la escuela y el resto de la comunidad
- `SEP-ESP-2-12.1` — Producción de textos dirigidos a autoridades y personas de la comunidad, en relación con necesidades, intereses o actividades escolares
- `SEP-ESP-2-13.1` — Lectura, escritura y otros tipos de interacción mediante lenguajes que ocurren en el contexto familiar
- `SEP-ESP-2-14.1` — Comunicación a distancia con familiares u otras personas
- `SEP-ESP-2-15.1` — Conversaciones o entrevistas con personas de la comunidad y otros lugares
- `SEP-ESP-2-16.1` — Reconocimiento de la diversidad lingüística y cultural en la familia, la escuela y el resto de la comunidad
- `SEP-ESP-2-17.1` — Exploración de testimonios escritos, fotográficos y audiovisuales del pasado familiar y comunitario
- `SEP-ESP-2-18.1` — Reflexión sobre los medios de comunicación
- `SEP-ESP-2-19.1` — Uso de elementos de los lenguajes artísticos en la vida cotidiana
- `SEP-ESP-2-20.1` — Uso de los lenguajes artísticos para expresar rasgos de las identidades personal y colectiva
- `SEP-ESP-2-21.1` — Intervención del entorno familiar y escolar para imaginar y realizar propuestas de mejora
- `SEP-ESP-2-22.1` — Apreciación de canciones, rondas infantiles, arrullos y cuentos
- `SEP-ESP-2-23.1` — Experimentación con elementos sonoros en composiciones literarias
- `SEP-ESP-2-24.1` — Interacción con manifestaciones culturales y artísticas
- `SEP-ESP-2-25.1` — Recreación de historias mediante el uso artístico de las palabras, del cuerpo, del espacio y del tiempo
- `SEP-ESP-2-26.1` — Representación de distintas formas de ser y estar en el mundo a partir de la ficción

**Grade 3** (25 standards):
- `SEP-ESP-3-1.1` — Narración de sucesos del pasado y del presente
- `SEP-ESP-3-2.1` — Descripción de personas, lugares, hechos y procesos
- `SEP-ESP-3-3.1` — Diálogo para la toma de acuerdos y el intercambio de puntos de vista
- `SEP-ESP-3-4.1` — Comprensión y producción de textos expositivos en los que se planteen: problema-solución, comparación-contraste, causa-consecuencia y enumeración
- `SEP-ESP-3-5.1` — Búsqueda y manejo reflexivo de información
- `SEP-ESP-3-6.1` — Comprensión y producción de textos discontinuos para organizar actividades y ordenar información
- `SEP-ESP-3-7.1` — Comprensión y producción de resúmenes
- `SEP-ESP-3-8.1` — Comprensión y producción de textos instructivos para realizar actividades escolares y participar en diversos juegos
- `SEP-ESP-3-9.1` — Exposición sobre temas diversos
- `SEP-ESP-3-10.1` — Comunicación a distancia con personas y propósitos diversos
- `SEP-ESP-3-11.1` — Análisis e intercambio de comentarios sobre empaques de productos y anuncios publicitarios
- `SEP-ESP-3-12.1` — Indagación, reelaboración y difusión de notas informativas con opiniones sobre hechos que afectan a la escuela y/o a la comunidad
- `SEP-ESP-3-13.1` — Uso de textos formales para atender diversos asuntos personales o del bienestar común
- `SEP-ESP-3-14.1` — Entrevistas con personas de la comunidad para conocer diversos temas
- `SEP-ESP-3-15.1` — Indagación sobre la diversidad lingüística en su comunidad y el resto del país
- `SEP-ESP-3-16.1` — Uso de croquis y mapas para describir trayectos o localizar lugares
- `SEP-ESP-3-17.1` — Reconocimiento y reflexión sobre el uso de elementos de los lenguajes artísticos, en manifestaciones culturales y artísticas de la comunidad y del resto del mundo
- `SEP-ESP-3-18.1` — Creación de propuestas con intención artística para mejorar la escuela y el resto de la comunidad
- `SEP-ESP-3-19.1` — Lectura y creación de poemas, canciones y juegos de palabras para su disfrute
- `SEP-ESP-3-20.1` — Experimentación con elementos visuales y sonoros en producciones colectivas artísticas
- `SEP-ESP-3-21.1` — Reflexión y uso de los lenguajes artísticos, para recrear experiencias estéticas que tienen lugar en la vida cotidiana
- `SEP-ESP-3-22.1` — Representación de hechos y experiencias significativas mediante el empleo de recursos textuales, visuales, corporales y sonoros
- `SEP-ESP-3-23.1` — Identificación del uso de la fantasía y la realidad en diferentes manifestaciones culturales y artísticas
- `SEP-ESP-3-24.1` — Lectura dramatizada y representación teatral
- `SEP-ESP-3-25.1` — Comprensión y producción de cuentos para su disfrute

**Grade 4** (25 standards):
- `SEP-ESP-4-1.1` — Narración de sucesos del pasado y del presente
- `SEP-ESP-4-2.1` — Descripción de personas, lugares, hechos y procesos
- `SEP-ESP-4-3.1` — Diálogo para la toma de acuerdos y el intercambio de puntos de vista
- `SEP-ESP-4-4.1` — Comprensión y producción de textos expositivos en los que se planteen: problema-solución, comparación-contraste, causa-consecuencia y enumeración
- `SEP-ESP-4-5.1` — Búsqueda y manejo reflexivo de información
- `SEP-ESP-4-6.1` — Comprensión y producción de textos discontinuos para organizar actividades y ordenar información
- `SEP-ESP-4-7.1` — Comprensión y producción de resúmenes
- `SEP-ESP-4-8.1` — Comprensión y producción de textos instructivos para realizar actividades escolares y participar en diversos juegos
- `SEP-ESP-4-9.1` — Exposición sobre temas diversos
- `SEP-ESP-4-10.1` — Comunicación a distancia con personas y propósitos diversos
- `SEP-ESP-4-11.1` — Análisis e intercambio de comentarios sobre empaques de productos y anuncios publicitarios
- `SEP-ESP-4-12.1` — Indagación, reelaboración y difusión de notas informativas con opiniones sobre hechos que afectan a la escuela y/o a la comunidad
- `SEP-ESP-4-13.1` — Uso de textos formales para atender diversos asuntos personales o del bienestar común
- `SEP-ESP-4-14.1` — Entrevistas con personas de la comunidad para conocer diversos temas
- `SEP-ESP-4-15.1` — Indagación sobre la diversidad lingüística en su comunidad y el resto del país
- `SEP-ESP-4-16.1` — Uso de croquis y mapas para describir trayectos o localizar lugares
- `SEP-ESP-4-17.1` — Reconocimiento y reflexión sobre el uso de elementos de los lenguajes artísticos, en manifestaciones culturales y artísticas de la comunidad y del resto del mundo
- `SEP-ESP-4-18.1` — Creación de propuestas con intención artística para mejorar la escuela y el resto de la comunidad
- `SEP-ESP-4-19.1` — Lectura y creación de poemas, canciones y juegos de palabras para su disfrute
- `SEP-ESP-4-20.1` — Experimentación con elementos visuales y sonoros en producciones colectivas artísticas
- `SEP-ESP-4-21.1` — Reflexión y uso de los lenguajes artísticos, para recrear experiencias estéticas que tienen lugar en la vida cotidiana
- `SEP-ESP-4-22.1` — Representación de hechos y experiencias significativas mediante el empleo de recursos textuales, visuales, corporales y sonoros
- `SEP-ESP-4-23.1` — Identificación del uso de la fantasía y la realidad en diferentes manifestaciones culturales y artísticas
- `SEP-ESP-4-24.1` — Lectura dramatizada y representación teatral
- `SEP-ESP-4-25.1` — Comprensión y producción de cuentos para su disfrute

**Grade 5** (24 standards):
- `SEP-ESP-5-1.1` — Narración de sucesos autobiográficos
- `SEP-ESP-5-2.1` — Comprensión y producción de textos explicativos
- `SEP-ESP-5-3.1` — Participación en debates sobre temas de interés común
- `SEP-ESP-5-4.1` — Comprensión y producción de textos argumentativos
- `SEP-ESP-5-5.1` — Comprensión y producción de textos informativos, para ampliar sus conocimientos sobre temas de interés tanto colectivo como individual
- `SEP-ESP-5-6.1` — Comprensión y producción de textos discontinuos, para organizar y presentar información
- `SEP-ESP-5-7.1` — Elaboración e intercambio de reseñas de diversos textos y/o audiovisuales
- `SEP-ESP-5-8.1` — Comparación y producción de documentos que regulan la convivencia
- `SEP-ESP-5-9.1` — Exposición sobre temas relacionados con el cuidado de la salud
- `SEP-ESP-5-10.1` — Producción y envío de cartas personales
- `SEP-ESP-5-11.1` — Interpretación y producción de anuncios publicitarios de productos o servicios ofrecidos en la comunidad
- `SEP-ESP-5-12.1` — Seguimiento crítico de noticias en diferentes medios de comunicación escrita
- `SEP-ESP-5-13.1` — Comprensión y producción de textos para gestionar servicios públicos
- `SEP-ESP-5-14.1` — Elaboración de un tríptico informativo sobre la prevención de algún problema colectivo
- `SEP-ESP-5-15.1` — Reconocimiento de la diversidad lingüística de México
- `SEP-ESP-5-16.1` — Interpretación y valoración de manifestaciones culturales y artísticas de México y del mundo
- `SEP-ESP-5-17.1` — Apropiación e intervención artística en el espacio comunitario
- `SEP-ESP-5-18.1` — Análisis de cuentos y poemas para su disfrute y comprensión
- `SEP-ESP-5-19.1` — Combinación de elementos visuales, sonoros y corporales, en composiciones artísticas colectivas, para expresar rasgos de sus identidades personal y colectiva
- `SEP-ESP-5-20.1` — Expresión, mediante el uso de los lenguajes artísticos, de experiencias estéticas que tienen lugar en la naturaleza
- `SEP-ESP-5-21.1` — Creación y representación de narrativas a partir de acontecimientos relevantes de la comunidad, empleando recursos literarios, visuales, corporales y sonoros
- `SEP-ESP-5-22.1` — Combinación de la realidad y la ficción en elementos simbólicos de las manifestaciones culturales y artísticas, que dan identidad y sentido de pertenencia
- `SEP-ESP-5-23.1` — Análisis y representación de guiones teatrales
- `SEP-ESP-5-24.1` — Lectura y análisis de mitos y leyendas, para su disfrute y valoración

**Grade 6** (24 standards):
- `SEP-ESP-6-1.1` — Narración de sucesos autobiográficos
- `SEP-ESP-6-2.1` — Comprensión y producción de textos explicativos
- `SEP-ESP-6-3.1` — Participación en debates sobre temas de interés común
- `SEP-ESP-6-4.1` — Comprensión y producción de textos argumentativos
- `SEP-ESP-6-5.1` — Comprensión y producción de textos informativos, para ampliar sus conocimientos sobre temas de interés tanto colectivo como individual
- `SEP-ESP-6-6.1` — Comprensión y producción de textos discontinuos, para organizar y presentar información
- `SEP-ESP-6-7.1` — Elaboración e intercambio de reseñas de diversos textos y/o audiovisuales
- `SEP-ESP-6-8.1` — Comparación y producción de documentos que regulan la convivencia
- `SEP-ESP-6-9.1` — Exposición sobre temas relacionados con el cuidado de la salud
- `SEP-ESP-6-10.1` — Producción y envío de cartas personales
- `SEP-ESP-6-11.1` — Interpretación y producción de anuncios publicitarios de productos o servicios ofrecidos en la comunidad
- `SEP-ESP-6-12.1` — Seguimiento crítico de noticias en diferentes medios de comunicación escrita
- `SEP-ESP-6-13.1` — Comprensión y producción de textos para gestionar servicios públicos
- `SEP-ESP-6-14.1` — Elaboración de un tríptico informativo sobre la prevención de algún problema colectivo
- `SEP-ESP-6-15.1` — Reconocimiento de la diversidad lingüística de México
- `SEP-ESP-6-16.1` — Interpretación y valoración de manifestaciones culturales y artísticas de México y del mundo
- `SEP-ESP-6-17.1` — Apropiación e intervención artística en el espacio comunitario
- `SEP-ESP-6-18.1` — Análisis de cuentos y poemas para su disfrute y comprensión
- `SEP-ESP-6-19.1` — Combinación de elementos visuales, sonoros y corporales, en composiciones artísticas colectivas, para expresar rasgos de sus identidades personal y colectiva
- `SEP-ESP-6-20.1` — Expresión, mediante el uso de los lenguajes artísticos, de experiencias estéticas que tienen lugar en la naturaleza
- `SEP-ESP-6-21.1` — Creación y representación de narrativas a partir de acontecimientos relevantes de la comunidad, empleando recursos literarios, visuales, corporales y sonoros
- `SEP-ESP-6-22.1` — Combinación de la realidad y la ficción en elementos simbólicos de las manifestaciones culturales y artísticas, que dan identidad y sentido de pertenencia
- `SEP-ESP-6-23.1` — Análisis y representación de guiones teatrales
- `SEP-ESP-6-24.1` — Lectura y análisis de mitos y leyendas, para su disfrute y valoración

### Ciencias Naturales

**Grade 1** (8 standards):
- `SEP-CNA-1-1.1` — Cuerpo humano: estructura externa, acciones para su cuidado y sus cambios como parte del crecimiento
- `SEP-CNA-1-2.1` — Beneficios del consumo de alimentos saludables, de agua simple potable, y de la práctica de actividad física
- `SEP-CNA-1-3.1` — Características del entorno natural y sociocultural
- `SEP-CNA-1-4.1` — Impacto de las actividades humanas en el entorno natural, así como acciones y prácticas socioculturales para su cuidado
- `SEP-CNA-1-5.1` — Objetos del entorno: características, propiedades, estados físicos y usos en la vida cotidiana
- `SEP-CNA-1-6.1` — Efectos de la aplicación de fuerzas: movimiento y deformación
- `SEP-CNA-1-7.1` — Características del sonido y la luz
- `SEP-CNA-1-8.1` — Cambios y regularidades de fenómenos naturales y actividades de las personas

**Grade 2** (8 standards):
- `SEP-CNA-2-1.1` — Cuerpo humano: estructura externa, acciones para su cuidado y sus cambios como parte del crecimiento
- `SEP-CNA-2-2.1` — Beneficios del consumo de alimentos saludables, de agua simple potable, y de la práctica de actividad física
- `SEP-CNA-2-3.1` — Características del entorno natural y sociocultural
- `SEP-CNA-2-4.1` — Impacto de las actividades humanas en el entorno natural, así como acciones y prácticas socioculturales para su cuidado
- `SEP-CNA-2-5.1` — Objetos del entorno: características, propiedades, estados físicos y usos en la vida cotidiana
- `SEP-CNA-2-6.1` — Efectos de la aplicación de fuerzas: movimiento y deformación
- `SEP-CNA-2-7.1` — Características del sonido y la luz
- `SEP-CNA-2-8.1` — Cambios y regularidades de fenómenos naturales y actividades de las personas

**Grade 3** (10 standards):
- `SEP-CNA-3-1.1` — Estructura y funcionamiento del cuerpo humano: sistemas locomotor y digestivo, así como prácticas para su cuidado, desde su contexto sociocultural
- `SEP-CNA-3-2.1` — Estructura y funcionamiento del cuerpo humano: sistema sexual; cambios en la pubertad e implicaciones socioculturales
- `SEP-CNA-3-3.1` — Alimentación saludable, con base en el Plato del Bien Comer, así como prácticas culturales y la toma de decisiones encaminadas a favorecer la salud y el medio ambiente y la economía familiar
- `SEP-CNA-3-4.1` — Interacciones entre plantas, animales y el entorno natural: nutrición y locomoción
- `SEP-CNA-3-5.1` — Relaciones entre los factores físicos y biológicos que conforman los ecosistemas y favorecen la preservación de la vida
- `SEP-CNA-3-6.1` — Impacto de las actividades humanas en la naturaleza y en la salud
- `SEP-CNA-3-7.1` — Propiedades de los materiales: masa y longitud; relación entre estados físicos y la temperatura
- `SEP-CNA-3-8.1` — Formación de mezclas y sus propiedades
- `SEP-CNA-3-9.1` — Efectos de la aplicación de fuerzas y del calor sobre los objetos
- `SEP-CNA-3-10.1` — Sistema Tierra-Luna-Sol: interacciones, cambios y regularidades; diversas explicaciones acerca del movimiento de estos astros y su relación con algunos fenómenos naturales

**Grade 4** (10 standards):
- `SEP-CNA-4-1.1` — Estructura y funcionamiento del cuerpo humano: sistemas locomotor y digestivo, así como prácticas para su cuidado, desde su contexto sociocultural
- `SEP-CNA-4-2.1` — Estructura y funcionamiento del cuerpo humano: sistema sexual; cambios en la pubertad e implicaciones socioculturales
- `SEP-CNA-4-3.1` — Alimentación saludable, con base en el Plato del Bien Comer, así como prácticas culturales y la toma de decisiones encaminadas a favorecer la salud y el medio ambiente y la economía familiar
- `SEP-CNA-4-4.1` — Interacciones entre plantas, animales y el entorno natural: nutrición y locomoción
- `SEP-CNA-4-5.1` — Relaciones entre los factores físicos y biológicos que conforman los ecosistemas y favorecen la preservación de la vida
- `SEP-CNA-4-6.1` — Impacto de las actividades humanas en la naturaleza y en la salud
- `SEP-CNA-4-7.1` — Propiedades de los materiales: masa y longitud; relación entre estados físicos y la temperatura
- `SEP-CNA-4-8.1` — Formación de mezclas y sus propiedades
- `SEP-CNA-4-9.1` — Efectos de la aplicación de fuerzas y del calor sobre los objetos
- `SEP-CNA-4-10.1` — Sistema Tierra-Luna-Sol: interacciones, cambios y regularidades; diversas explicaciones acerca del movimiento de estos astros y su relación con algunos fenómenos naturales

**Grade 5** (12 standards):
- `SEP-CNA-5-1.1` — Estructura y funcionamiento del cuerpo humano: sistemas circulatorio, respiratorio e inmunológico, y su relación con la salud ambiental, así como acciones para su cuidado
- `SEP-CNA-5-2.1` — Etapas del desarrollo humano: proceso de reproducción y prevención de infecciones de transmisión sexual (ITS) y embarazos en adolescentes, en el marco de la salud sexual y reproductiva
- `SEP-CNA-5-3.1` — Alimentación saludable: características de la dieta correcta, costumbres de la comunidad, riesgos del consumo de alimentos ultraprocesados, y acciones para mejorar la alimentación
- `SEP-CNA-5-4.1` — Funciones vitales que caracterizan a plantas y animales como seres vivos, y su relación con el entorno natural, así como sus cambios a través del tiempo
- `SEP-CNA-5-5.1` — Factores que conforman la biodiversidad y el medio ambiente, la riqueza natural de México y su relevancia como parte del patrimonio biocultural de la humanidad, y la importancia de su conservación
- `SEP-CNA-5-6.1` — Pérdida de biodiversidad, problemas medio ambientales en la comunidad, México y el mundo, acciones orientadas a fortalecer estilos de vida sustentables
- `SEP-CNA-5-7.1` — Costos y beneficios del consumo de agua, energía eléctrica y combustibles en la satisfacción de necesidades personales
- `SEP-CNA-5-8.1` — Propiedades de los materiales: dureza, flexibilidad y permeabilidad y su aplicación en la satisfacción de necesidades; caracterización de los gases con base en sus propiedades
- `SEP-CNA-5-9.1` — Cambios permanentes en los materiales y sus implicaciones en la vida diaria
- `SEP-CNA-5-10.1` — Efecto del magnetismo y de la fuerza de gravedad
- `SEP-CNA-5-11.1` — Transformaciones de la energía térmica y eléctrica, así como su aplicación tecnológica
- `SEP-CNA-5-12.1` — Sistema Solar y Universo: características de sus componentes, y aportaciones culturales, científicas y tecnológicas que han favorecido su conocimiento

**Grade 6** (12 standards):
- `SEP-CNA-6-1.1` — Estructura y funcionamiento del cuerpo humano: sistemas circulatorio, respiratorio e inmunológico, y su relación con la salud ambiental, así como acciones para su cuidado
- `SEP-CNA-6-2.1` — Etapas del desarrollo humano: proceso de reproducción y prevención de infecciones de transmisión sexual (ITS) y embarazos en adolescentes, en el marco de la salud sexual y reproductiva
- `SEP-CNA-6-3.1` — Alimentación saludable: características de la dieta correcta, costumbres de la comunidad, riesgos del consumo de alimentos ultraprocesados, y acciones para mejorar la alimentación
- `SEP-CNA-6-4.1` — Funciones vitales que caracterizan a plantas y animales como seres vivos, y su relación con el entorno natural, así como sus cambios a través del tiempo
- `SEP-CNA-6-5.1` — Factores que conforman la biodiversidad y el medio ambiente, la riqueza natural de México y su relevancia como parte del patrimonio biocultural de la humanidad, y la importancia de su conservación
- `SEP-CNA-6-6.1` — Pérdida de biodiversidad, problemas medio ambientales en la comunidad, México y el mundo, acciones orientadas a fortalecer estilos de vida sustentables
- `SEP-CNA-6-7.1` — Costos y beneficios del consumo de agua, energía eléctrica y combustibles en la satisfacción de necesidades personales
- `SEP-CNA-6-8.1` — Propiedades de los materiales: dureza, flexibilidad y permeabilidad y su aplicación en la satisfacción de necesidades; caracterización de los gases con base en sus propiedades
- `SEP-CNA-6-9.1` — Cambios permanentes en los materiales y sus implicaciones en la vida diaria
- `SEP-CNA-6-10.1` — Efecto del magnetismo y de la fuerza de gravedad
- `SEP-CNA-6-11.1` — Transformaciones de la energía térmica y eléctrica, así como su aplicación tecnológica
- `SEP-CNA-6-12.1` — Sistema Solar y Universo: características de sus componentes, y aportaciones culturales, científicas y tecnológicas que han favorecido su conocimiento

## Prerequisites

Prerequisites were automatically assigned when the same topic name appears
at the previous grade level. Cross-topic prerequisites were NOT automatically
assigned as they require pedagogical judgment.

- Standards with prerequisites: 141
- Standards at Grade 1 (no prerequisites possible): 41
- Standards at Grade 2+ with no matching prior topic: 80

### Standards without prerequisites (Grade 2+)

These standards have topics that don't appear at the prior grade level.
Prerequisites may need manual review:

- `SEP-MAT-2-3.1` (Grade 2) — Construcción de la noción de multiplicación y división, y su relación como operaciones inversas
- `SEP-MAT-3-2.1` (Grade 3) — Suma y resta, su relación como operaciones inversas
- `SEP-MAT-3-3.1` (Grade 3) — Multiplicación y división, su relación como operaciones inversas
- `SEP-MAT-4-6.1` (Grade 4) — Cálculo de perímetro y área
- `SEP-MAT-5-4.1` (Grade 5) — Relaciones de proporcionalidad
- `SEP-MAT-5-7.1` (Grade 5) — Ubicación espacial
- `SEP-MAT-5-8.1` (Grade 5) — Medición de longitud, masa y capacidad
- `SEP-MAT-5-9.1` (Grade 5) — Perímetro, área y noción de volumen
- `SEP-MAT-5-11.1` (Grade 5) — Nociones de probabilidad
- `SEP-ESP-3-1.1` (Grade 3) — Narración de sucesos del pasado y del presente
- `SEP-ESP-3-2.1` (Grade 3) — Descripción de personas, lugares, hechos y procesos
- `SEP-ESP-3-3.1` (Grade 3) — Diálogo para la toma de acuerdos y el intercambio de puntos de vista
- `SEP-ESP-3-4.1` (Grade 3) — Comprensión y producción de textos expositivos en los que se planteen: problema-solución, comparación-contraste, causa-consecuencia y enumeración
- `SEP-ESP-3-5.1` (Grade 3) — Búsqueda y manejo reflexivo de información
- `SEP-ESP-3-6.1` (Grade 3) — Comprensión y producción de textos discontinuos para organizar actividades y ordenar información
- `SEP-ESP-3-7.1` (Grade 3) — Comprensión y producción de resúmenes
- `SEP-ESP-3-8.1` (Grade 3) — Comprensión y producción de textos instructivos para realizar actividades escolares y participar en diversos juegos
- `SEP-ESP-3-9.1` (Grade 3) — Exposición sobre temas diversos
- `SEP-ESP-3-10.1` (Grade 3) — Comunicación a distancia con personas y propósitos diversos
- `SEP-ESP-3-11.1` (Grade 3) — Análisis e intercambio de comentarios sobre empaques de productos y anuncios publicitarios
- `SEP-ESP-3-12.1` (Grade 3) — Indagación, reelaboración y difusión de notas informativas con opiniones sobre hechos que afectan a la escuela y/o a la comunidad
- `SEP-ESP-3-13.1` (Grade 3) — Uso de textos formales para atender diversos asuntos personales o del bienestar común
- `SEP-ESP-3-14.1` (Grade 3) — Entrevistas con personas de la comunidad para conocer diversos temas
- `SEP-ESP-3-15.1` (Grade 3) — Indagación sobre la diversidad lingüística en su comunidad y el resto del país
- `SEP-ESP-3-16.1` (Grade 3) — Uso de croquis y mapas para describir trayectos o localizar lugares
- `SEP-ESP-3-17.1` (Grade 3) — Reconocimiento y reflexión sobre el uso de elementos de los lenguajes artísticos, en manifestaciones culturales y artísticas de la comunidad y del resto del mundo
- `SEP-ESP-3-18.1` (Grade 3) — Creación de propuestas con intención artística para mejorar la escuela y el resto de la comunidad
- `SEP-ESP-3-19.1` (Grade 3) — Lectura y creación de poemas, canciones y juegos de palabras para su disfrute
- `SEP-ESP-3-20.1` (Grade 3) — Experimentación con elementos visuales y sonoros en producciones colectivas artísticas
- `SEP-ESP-3-21.1` (Grade 3) — Reflexión y uso de los lenguajes artísticos, para recrear experiencias estéticas que tienen lugar en la vida cotidiana
- `SEP-ESP-3-22.1` (Grade 3) — Representación de hechos y experiencias significativas mediante el empleo de recursos textuales, visuales, corporales y sonoros
- `SEP-ESP-3-23.1` (Grade 3) — Identificación del uso de la fantasía y la realidad en diferentes manifestaciones culturales y artísticas
- `SEP-ESP-3-24.1` (Grade 3) — Lectura dramatizada y representación teatral
- `SEP-ESP-3-25.1` (Grade 3) — Comprensión y producción de cuentos para su disfrute
- `SEP-ESP-5-1.1` (Grade 5) — Narración de sucesos autobiográficos
- `SEP-ESP-5-2.1` (Grade 5) — Comprensión y producción de textos explicativos
- `SEP-ESP-5-3.1` (Grade 5) — Participación en debates sobre temas de interés común
- `SEP-ESP-5-4.1` (Grade 5) — Comprensión y producción de textos argumentativos
- `SEP-ESP-5-5.1` (Grade 5) — Comprensión y producción de textos informativos, para ampliar sus conocimientos sobre temas de interés tanto colectivo como individual
- `SEP-ESP-5-6.1` (Grade 5) — Comprensión y producción de textos discontinuos, para organizar y presentar información
- `SEP-ESP-5-7.1` (Grade 5) — Elaboración e intercambio de reseñas de diversos textos y/o audiovisuales
- `SEP-ESP-5-8.1` (Grade 5) — Comparación y producción de documentos que regulan la convivencia
- `SEP-ESP-5-9.1` (Grade 5) — Exposición sobre temas relacionados con el cuidado de la salud
- `SEP-ESP-5-10.1` (Grade 5) — Producción y envío de cartas personales
- `SEP-ESP-5-11.1` (Grade 5) — Interpretación y producción de anuncios publicitarios de productos o servicios ofrecidos en la comunidad
- `SEP-ESP-5-12.1` (Grade 5) — Seguimiento crítico de noticias en diferentes medios de comunicación escrita
- `SEP-ESP-5-13.1` (Grade 5) — Comprensión y producción de textos para gestionar servicios públicos
- `SEP-ESP-5-14.1` (Grade 5) — Elaboración de un tríptico informativo sobre la prevención de algún problema colectivo
- `SEP-ESP-5-15.1` (Grade 5) — Reconocimiento de la diversidad lingüística de México
- `SEP-ESP-5-16.1` (Grade 5) — Interpretación y valoración de manifestaciones culturales y artísticas de México y del mundo
- `SEP-ESP-5-17.1` (Grade 5) — Apropiación e intervención artística en el espacio comunitario
- `SEP-ESP-5-18.1` (Grade 5) — Análisis de cuentos y poemas para su disfrute y comprensión
- `SEP-ESP-5-19.1` (Grade 5) — Combinación de elementos visuales, sonoros y corporales, en composiciones artísticas colectivas, para expresar rasgos de sus identidades personal y colectiva
- `SEP-ESP-5-20.1` (Grade 5) — Expresión, mediante el uso de los lenguajes artísticos, de experiencias estéticas que tienen lugar en la naturaleza
- `SEP-ESP-5-21.1` (Grade 5) — Creación y representación de narrativas a partir de acontecimientos relevantes de la comunidad, empleando recursos literarios, visuales, corporales y sonoros
- `SEP-ESP-5-22.1` (Grade 5) — Combinación de la realidad y la ficción en elementos simbólicos de las manifestaciones culturales y artísticas, que dan identidad y sentido de pertenencia
- `SEP-ESP-5-23.1` (Grade 5) — Análisis y representación de guiones teatrales
- `SEP-ESP-5-24.1` (Grade 5) — Lectura y análisis de mitos y leyendas, para su disfrute y valoración
- `SEP-CNA-3-1.1` (Grade 3) — Estructura y funcionamiento del cuerpo humano: sistemas locomotor y digestivo, así como prácticas para su cuidado, desde su contexto sociocultural
- `SEP-CNA-3-2.1` (Grade 3) — Estructura y funcionamiento del cuerpo humano: sistema sexual; cambios en la pubertad e implicaciones socioculturales
- `SEP-CNA-3-3.1` (Grade 3) — Alimentación saludable, con base en el Plato del Bien Comer, así como prácticas culturales y la toma de decisiones encaminadas a favorecer la salud y el medio ambiente y la economía familiar
- `SEP-CNA-3-4.1` (Grade 3) — Interacciones entre plantas, animales y el entorno natural: nutrición y locomoción
- `SEP-CNA-3-5.1` (Grade 3) — Relaciones entre los factores físicos y biológicos que conforman los ecosistemas y favorecen la preservación de la vida
- `SEP-CNA-3-6.1` (Grade 3) — Impacto de las actividades humanas en la naturaleza y en la salud
- `SEP-CNA-3-7.1` (Grade 3) — Propiedades de los materiales: masa y longitud; relación entre estados físicos y la temperatura
- `SEP-CNA-3-8.1` (Grade 3) — Formación de mezclas y sus propiedades
- `SEP-CNA-3-9.1` (Grade 3) — Efectos de la aplicación de fuerzas y del calor sobre los objetos
- `SEP-CNA-3-10.1` (Grade 3) — Sistema Tierra-Luna-Sol: interacciones, cambios y regularidades; diversas explicaciones acerca del movimiento de estos astros y su relación con algunos fenómenos naturales
- `SEP-CNA-5-1.1` (Grade 5) — Estructura y funcionamiento del cuerpo humano: sistemas circulatorio, respiratorio e inmunológico, y su relación con la salud ambiental, así como acciones para su cuidado
- `SEP-CNA-5-2.1` (Grade 5) — Etapas del desarrollo humano: proceso de reproducción y prevención de infecciones de transmisión sexual (ITS) y embarazos en adolescentes, en el marco de la salud sexual y reproductiva
- `SEP-CNA-5-3.1` (Grade 5) — Alimentación saludable: características de la dieta correcta, costumbres de la comunidad, riesgos del consumo de alimentos ultraprocesados, y acciones para mejorar la alimentación
- `SEP-CNA-5-4.1` (Grade 5) — Funciones vitales que caracterizan a plantas y animales como seres vivos, y su relación con el entorno natural, así como sus cambios a través del tiempo
- `SEP-CNA-5-5.1` (Grade 5) — Factores que conforman la biodiversidad y el medio ambiente, la riqueza natural de México y su relevancia como parte del patrimonio biocultural de la humanidad, y la importancia de su conservación
- `SEP-CNA-5-6.1` (Grade 5) — Pérdida de biodiversidad, problemas medio ambientales en la comunidad, México y el mundo, acciones orientadas a fortalecer estilos de vida sustentables
- `SEP-CNA-5-7.1` (Grade 5) — Costos y beneficios del consumo de agua, energía eléctrica y combustibles en la satisfacción de necesidades personales
- `SEP-CNA-5-8.1` (Grade 5) — Propiedades de los materiales: dureza, flexibilidad y permeabilidad y su aplicación en la satisfacción de necesidades; caracterización de los gases con base en sus propiedades
- `SEP-CNA-5-9.1` (Grade 5) — Cambios permanentes en los materiales y sus implicaciones en la vida diaria
- `SEP-CNA-5-10.1` (Grade 5) — Efecto del magnetismo y de la fuerza de gravedad
- `SEP-CNA-5-11.1` (Grade 5) — Transformaciones de la energía térmica y eléctrica, así como su aplicación tecnológica
- `SEP-CNA-5-12.1` (Grade 5) — Sistema Solar y Universo: características de sus componentes, y aportaciones culturales, científicas y tecnológicas que han favorecido su conocimiento

## Gaps, Ambiguities, and Notes

### Structural Notes

1. **Campo Formativo mapping**: The SEP 2024 curriculum uses 'Campos formativos'
   rather than traditional subject names. The mapping used:
   - 'Lenguajes' → Español (reading, writing, oral communication, artistic expression)
   - 'Saberes y Pensamiento Científico' → Matemáticas + Ciencias Naturales

2. **Español scope**: The 'Lenguajes' campo formativo includes artistic expression
   and cultural appreciation alongside traditional language arts. These were all
   mapped to 'Español' since the SEP treats them as an integrated field.

3. **Phase 3 consolidation**: Phase 3 (Grades 1-2) documents list individual
   Procesos de desarrollo de aprendizaje as separate bullet points per Contenido,
   while Phases 4-5 present them as continuous paragraphs. Phase 3 bullets were
   concatenated to maintain consistent granularity across all grades.

4. **Cross-topic prerequisites**: The automatic prerequisite assignment only links
   same-topic entries across adjacent grades. Cross-topic prerequisites (e.g.,
   addition is a prerequisite for multiplication) require pedagogical review and
   were intentionally left for human curation.

5. **Topic name changes between phases**: Some topics change names between
   phases (e.g., Grades 2→3 transition). These discontinuities mean the
   prerequisite chain breaks and needs manual linking.

## Blockers for Day 2

1. **Cross-topic prerequisite review needed**: Math prerequisites like
   'addition before multiplication' need human input
2. **Phase transition topic mapping**: Topics that change names between
   Phase 3→4 and Phase 4→5 need manual prerequisite linking
3. **Español artistic content**: Confirm whether artistic expression standards
   should remain under Español or be separated for the Learning OS
