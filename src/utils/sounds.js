// Sound effects utility
export const sounds = {
  coin: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Lzu2MdBzaP1/LNdy4FJXjI8N6RPwoUYLXq7KlXFgpIoOL0ul4dBjiQ1vHMeS4FJHnI8N+RQAsUYLXq66hWFgpIouP0u2AdBziP1vLMeS4GJHnI8N+RQAoUYLXq66hXFgpHoOP0vGAdBjiP1vLMeS4FJHnI8N+RQAsUYLXq66hWFgpHoOP0u2AdBjiO1vLMeS4FJHnI8N6RQAsUX7Xp66hVFQpGn+Lzu2MdBziO1vLNeSsFJHfH8NyQPwoTXbPp66hVFQpGnuHzu2IdBjaO1/HNeSwGI3fH8NyQPgoSXLPo66dUEwlEm9/yvF8aBjaM1e/MdywFI3bG79qOPQgQWK7n6qVSEghBmNzvuVsZAzWH0ezIcCQEHWq/7daHNQgOUKXh5qFODwY+ldrqr1UTBSty0OfPfygCGmbA69OBLwQJTJzc45VHCwMym9nbpk0MAx1auejVgyQBDkqX2uSaSwkFQJTY54M+BwVLmdnhl0IJBR1kturfgCIAC0uU2eCXRQkDPZHS5ptJBwMdZLXp14AiAAhIkdXej0EHAy1+zObQejABAiZrv+rTfCcBAztdq9nVfSsBAiJ3xuzUgjABACBou+nPdyUAAzBapdbReCkAAiB2w+rTgC8AABtnuejNdSIAAi5WptXQdygAASB1wunSfS4AABpl' +
      't+fMcyAAAi1UptXQdigAAh9zwunSfC0AABpjtefMciAAASxTo9XPdiYAAh9yw+nRey0AABljt+fLcSAAAStUo9TOdSYAAh9xwunRei0AABljtuXKcB8AAypSotPMdCUAAR5xwenQeSwAABpituXLcB8AASxRodLLcyQAARxvwObOeCsAABljtuTKbx4AASxRoNDKcyQAAh1vwObOdysAABlituTJbx4AASxQntDLciMAARxuw+TNeCoAABljtuPJbh0AASxQntDLciMAARxuw+TNeSoAABljtuPJbh0AASxQntDLciMAARxuw+TNeSoAABljtePJbh0AASxQns/LciMAARxuw+TNeSoAABljtuPJbh0AASxQns/LciMAARxuw+TNeSoAABljtuPJbh0AASxQns/LciMAARxuw+TNeSoAABljtuPJbh0AASxPns/LcSIAAhxuw+TNeSoAABljtuPJbh0AASxPns/LcSIAAhxuw+TNeSoAABljtuPJbh0AASxPns/LcSIAAhxuw+TNeSo=')
    audio.volume = 0.3
    audio.play().catch(() => {})
  },
  success: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
    audio.volume = 0.4
    audio.play().catch(() => {})
  },
  click: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
    audio.volume = 0.1
    audio.play().catch(() => {})
  },
  notification: () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=')
    audio.volume = 0.2
    audio.play().catch(() => {})
  }
}

export const playCoinSound = () => sounds.coin()
export const playSuccessSound = () => sounds.success()
export const playClickSound = () => sounds.click()
export const playNotificationSound = () => sounds.notification()

export default sounds
