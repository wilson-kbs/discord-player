import { EmbedPlayerStates, EmbedViewState } from "@modules/player/types/view";
import { TimeToString } from "@modules/player/utils";
import { Message, MessageEmbed } from "discord.js";

const SIZE_MAX_PLAYING_POSITION_BAR = 40;
const MAX_ROW_CHAR = 38;

export class PlayerViewEmbeds {
  private _embed: MessageEmbed;

  /**
   *
   * @param now Seconds
   * @param end Seconds
   * @returns
   */
  private getPercentBar(now: number, end?: number): string {
    let stringTimesBar = ``;

    const duration = end ?? 0;

    const intervalePushChar = duration / SIZE_MAX_PLAYING_POSITION_BAR;

    console.log("end : ", end);

    const SizeCurrentPositionBar = !end
      ? -1
      : Math.floor(now / intervalePushChar);

    for (let i = 0; i < SIZE_MAX_PLAYING_POSITION_BAR; i++) {
      if (i < SizeCurrentPositionBar) stringTimesBar += `|`;
      else stringTimesBar += ` `;
    }
    return stringTimesBar;
  }

  private getTimesBar(now: number, end?: number): string {
    return `\`${TimeToString(now, true)} |${this.getPercentBar(now, end)}| ${
      !end ? "-:--" : TimeToString(end, true)
    }\``;
  }

  private getWaitingLineElements(els: Array<string>) {
    return `\`\`\`\n${(() => {
      let elements = ``;
      for (const item of els) {
        elements += `- ${
          item.length > MAX_ROW_CHAR
            ? item.substring(0, MAX_ROW_CHAR) + "..."
            : item
        }\n`;
      }
      return elements;
    })()} \`\`\``;
  }

  playerFromState(state: EmbedPlayerStates) {
    const timesBar = this.getTimesBar(state.time, state.duration);
    this._embed.setDescription(timesBar);
    this._embed.setTitle(state.titleTrack);

    this._embed.setURL(state.urlTrack);

    this._embed.setFields([
      {
        name: "File d'attente",
        value: this.getWaitingLineElements(state.nextTracks),
        inline: false,
      },
    ]);
    // this._embed.setURL("");
    return [this._embed];
  }

  constructor() {
    this._embed = new MessageEmbed()
      .setColor("RANDOM")
      .setAuthor("Player", "https://i.imgur.com/AfFp7pu.png")
      .setTitle("Aucun Titre")
      .setThumbnail("https://i.imgur.com/AfFp7pu.png");
  }
}
