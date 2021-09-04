export const PlayerErrorString = {
  default:
    "Une erreur est survenu veuillez ressayer plus tard. Si le problème persiste s'il vous plaît veuillez contacter les administrateurs de votre serveur avant de contacter les développeurs",
  init: "Le player n'est pas initialiser sur le serveur. Veuillez contacter l'administrateur de votre serveur",
};

export function TimeToString(num: number, force: boolean = false) {
  if (!num && !force) return "-:--";

  const time = Math.floor(num);

  const minutes = Math.floor(time / 60);

  const seconds = time % 60;

  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
