import {
  ActionButton,
  ActionButtonState,
  ActionStates,
} from "@modules/player/types/view";
import { PlayerErrorString } from "@modules/player/utils";
import { MessageButton, MessageActionRow } from "discord.js";

const MAX_NUMBER_BUTTON_IN_ROW = 5;

const Buttons: Array<ActionButton> = [
  {
    // PLAY / PAUSE BTN
    id: "play_pause",
    states: [
      {
        id: "PLAY",
        payload: "▶",
        default: true,
        style: "PRIMARY",
        disable: false,
      },
      {
        id: "PAUSE",
        payload: "▶",
        style: "SECONDARY",
        disable: false,
      },
    ],
  },
  {
    // STOP BTN
    id: "stop",
    states: [
      {
        id: "DENIE",
        payload: "⏹",
        default: true,
        style: "DANGER",
        disable: true,
      },
      {
        id: "ALLOW",
        payload: "⏹",
        style: "SECONDARY",
        disable: false,
      },
    ],
  },
  {
    // PREV BTN
    id: "prev",
    states: [
      {
        id: "DEFAULT",
        payload: "⏪",
        style: "SECONDARY",
        disable: false,
      },
    ],
  },
  {
    // NEXT BTN
    id: "next",
    states: [
      {
        id: "DEFAULT",
        payload: "⏩",
        style: "SECONDARY",
        disable: false,
      },
    ],
  },

  {
    // REPEAT BTN
    id: "repeat",
    states: [
      {
        id: "NONE",
        payload: "🔁",
        default: true,
        style: "SECONDARY",
        disable: false,
      },
      {
        id: "ALL",
        payload: "🔁",
        style: "PRIMARY",
        disable: false,
      },
      {
        id: "ONE",
        payload: "🔁",
        style: "PRIMARY",
        disable: false,
      },
    ],
  },
  {
    // MUTE BTN
    id: "mute",
    states: [
      {
        id: "DISABLE",
        payload: "🔇",
        style: "SECONDARY",
        disable: false,
      },
      {
        id: "ACTIVE",
        payload: "🔇",
        style: "DANGER",
        disable: false,
      },
    ],
  },
  {
    // VOL_DOWN BTN
    id: "vol_down",
    states: [
      {
        id: "DEFAULT",
        payload: "🔉",
        style: "PRIMARY",
        disable: false,
      },
    ],
  },
  {
    // VOL_UP
    id: "vol_up",
    states: [
      {
        id: "DEFAULT",
        payload: "🔊",
        style: "PRIMARY",
        disable: false,
      },
    ],
  },
];

export class PlayViewButtons {
  private _buttons: Array<MessageButton>;
  private _numColBtn: number = MAX_NUMBER_BUTTON_IN_ROW;

  /** @readonly */
  get numColBtn() {
    return this._numColBtn;
  }

  private makeButtons(buttons: Array<ActionButton>) {
    try {
      return buttons.map((item) => {
        const button = new MessageButton();
        let state: ActionButtonState;

        if (item.states.length == 1) {
          state = item.states[0];
        } else {
          state = item.states.filter((item) => item.default)[0];
          if (!state) state = item.states[0];
          if (!state)
            throw new Error("state is undefined in make button message");
        }
        button
          .setCustomId(item.id)
          .setStyle(state.style)
          .setLabel(state.payload)
          .setDisabled(state.disable);
        return button;
      });
    } catch (error) {
      console.error(error);
      throw new Error("Error to make button");
    }
  }

  setNumColBtn(num: number) {
    if (num > MAX_NUMBER_BUTTON_IN_ROW)
      throw new Error(
        `Max number button on row is ${MAX_NUMBER_BUTTON_IN_ROW}`
      );
    this._numColBtn = num;
  }

  getActionRowButtons() {
    const components: Array<MessageActionRow> = [];
    const numberElement = this._numColBtn;
    const size = this._buttons.length;

    const NUMBER_COMPLETE_ROW = Math.floor(size / numberElement);
    const NUM_ITER =
      size % numberElement > 0 ? NUMBER_COMPLETE_ROW + 1 : NUMBER_COMPLETE_ROW;

    let count = 0;

    for (let i = 0; i < NUM_ITER; i++) {
      let start = i * numberElement;
      let end =
        (i == NUM_ITER - 1 && NUM_ITER) == NUMBER_COMPLETE_ROW + 1
          ? undefined
          : (i + 1) * numberElement;

      components.push(
        new MessageActionRow().addComponents(this._buttons.slice(start, end))
      );
    }
    return components;
  }

  setActionButtonState<K extends keyof ActionStates>(
    buttonId: K,
    state: ActionStates[K]
  ) {
    const button = this._buttons.find((item) => item.customId == buttonId);
    const buttonStates = Buttons.map((item) =>
      item.id == buttonId ? item.states : undefined
    )[0];
    if (!buttonStates || !button) throw new Error(PlayerErrorString.default);
    const buttonState = buttonStates.find((item) => item.id == state);
    if (!buttonState) throw new Error(PlayerErrorString.default);
    button.setLabel(buttonState.payload);
    button.setStyle(buttonState.style);
    button.setDisabled(buttonState.disable);
    return this;
  }

  constructor() {
    this._buttons = this.makeButtons(Buttons);
    // console.log(this.getActionRowButtons());
  }
}
