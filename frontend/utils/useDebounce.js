/* 
Un hook personnalisé permet de réutiliser une logique d'état ou d'effets dans 
différents composants. Ce code en particulier est utilisé pour mettre en œuvre 
un comportement de debounce. Le debounce est une technique de programmation 
utilisée pour s'assurer qu'une fonction n'est pas appelée trop fréquemment, 
ce qui peut être utile pour des opérations coûteuses en termes de performances, 
comme des appels API ou des calculs lourds qui se déclenchent en réponse à des 
événements fréquents 
*/

import { useEffect, useState } from 'react'

/* 
Cette ligne déclare le hook personnalisé useDebounce, qui prend deux 
paramètres : value (la valeur à débouncer) et delay (le délai en millisecondes
avant que la valeur débouncée soit mise à jour). 
*/ 
export function useDebounce(value, delay) {
  /* 
  Ici, on utilise useState pour créer une variable d'état debouncedValue. 
  Cette variable stocke la valeur actuelle débouncée. Elle est initialisée avec 
  la value passée en paramètre. 
  */
  const [debouncedValue, setDebouncedValue] = useState(value)

  /* 
  À l'intérieur de useEffect, un timer est défini avec setTimeout. 
  Il mettra à jour debouncedValue avec la value actuelle après le délai 
  spécifié (delay). Si aucun delay n'est fourni, un délai par défaut 
  de 500 millisecondes (0.5 secondes) est utilisé.
  */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

    /* 
    Cette fonction de nettoyage est retournée par useEffect. Elle est exécutée 
    avant que le composant soit démonté ou avant que l'effet ne soit réexécuté. 
    Elle sert à annuler le timer, évitant ainsi des mises à jour d'état sur un 
    composant non monté.
    */
    return () => {
      clearTimeout(timer)
    }
  /* 
  Le tableau de dépendances indique à React de réexécuter l'effet seulement si 
  value ou delay change. Cela garantit que le timer est réinitialisé si l'une 
  de ces valeurs est mise à jour.
  */
  }, [value, delay])

  /* Finalement, le hook retourne debouncedValue. Cela permet à d'autres composants 
  d'utiliser la valeur débouncée mise à jour. */
  return debouncedValue
}