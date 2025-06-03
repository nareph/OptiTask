// src/utils/notifications.ts

export interface NotifyOptions {
  type?: 'success' | 'error' | 'info' | 'warning'; // Ajout de warning
  duration?: number; // en ms
  // onClick?: () => void; // Pour rendre le toast cliquable
  // Peut-être un ID pour gérer plusieurs toasts ou les mettre à jour ?
}

export const notify = (message: string, options?: NotifyOptions): void => {
  const notificationType = options?.type || 'info';
  const toastDuration = options?.duration || 3000;

  // 1. Notifications Natives du Navigateur
  if (typeof window !== 'undefined' && 'Notification' in window) {
      const showNativeNotification = () => {
          // Optionnel: Ajouter une icône basée sur le type
          // const icon = notificationType === 'success' ? '/icons/success.png' : ...
          new Notification("OptiTask", { body: message /*, icon */ });
      };

      if (Notification.permission === 'granted') {
          showNativeNotification();
      } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                  showNativeNotification();
              }
          });
      }
      // Si la permission est 'denied', on passe au fallback toast
  }

  // 2. Fallback Toast (ou affichage systématique en plus de la notif native si souhaité)
  // S'assurer que document est disponible (devrait toujours l'être si window l'est pour les actions UI)
  if (typeof document === 'undefined') return;

  const toast = document.createElement('div');
  
  let bgColorClass = 'bg-blue-500'; // Default pour info
  if (notificationType === 'success') bgColorClass = 'bg-green-500';
  else if (notificationType === 'error') bgColorClass = 'bg-red-500';
  else if (notificationType === 'warning') bgColorClass = 'bg-yellow-500 text-black'; // Warning avec texte noir pour lisibilité

  // Pour l'animation (exemple simple)
  toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(20px)';

  // Application des classes après avoir défini les styles initiaux pour l'animation
  // requestAnimationFrame aide à s'assurer que les styles initiaux sont appliqués avant les styles finaux
  requestAnimationFrame(() => {
      toast.className = `fixed bottom-5 right-5 p-4 rounded-md shadow-lg text-white text-sm z-[100] ${bgColorClass}`;
      toast.textContent = message;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
  });
  
  document.body.appendChild(toast);

  setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      // Attendre la fin de l'animation avant de supprimer
      toast.addEventListener('transitionend', () => toast.remove());
  }, toastDuration);
};

// Pour tester (peut être appelé dans un composant)
// useEffect(() => {
//   notify("Ceci est un succès !", { type: "success" });
//   setTimeout(() => notify("Ceci est une erreur.", { type: "error", duration: 5000 }), 1000);
//   setTimeout(() => notify("Ceci est une info.", { type: "info" }), 2000);
//   setTimeout(() => notify("Ceci est un avertissement.", { type: "warning" }), 3000);
// }, []);