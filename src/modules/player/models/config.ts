import { Type } from "class-transformer";

export class ConfigChannel {
  id: string;
  isLocked: boolean;
  constructor(id: string, isLocked: boolean) {
    this.id = id;
    this.isLocked = isLocked;
  }
}

interface MessageIds {
  channelId: string;
  messageId: string;
}

export class PlayerStateChannels {
  private channelId: string;

  private isLockedChannel: boolean;

  private messageIds: Array<MessageIds>;

  /**
   *  Is channel ID
   *  @readonly
   */
  get id() {
    return this.channelId;
  }

  get locked() {
    return this.isLockedChannel;
  }

  isLocked(): boolean {
    return this.locked;
  }

  setLock(lock: boolean) {
    this.isLockedChannel = lock;
  }

  setChannelId(channelId: string) {
    if (this.locked) return false;
    this.channelId = channelId;
    return true;
  }

  private playerMessageId: string;

  get lockMessageId(): string | undefined {
    return this.playerMessageId;
  }

  get messagesPlayer() {
    return this.messageIds;
  }

  getMessageId(channelId: string) {
    if (this.isLocked())
      return !!this.playerMessageId ? this.playerMessageId : undefined;
    const items = this.messageIds.filter((item) => item.channelId == channelId);
    if (!items.length) return undefined;
    return items[0].messageId;
  }

  setMessageId(channelId: string, messageId: string) {
    if (this.isLocked()) this.playerMessageId = messageId;
    const items = this.messageIds.filter((item) => item.channelId == channelId);
    if (items.length) items[0].messageId = messageId;
    else this.messageIds.push({ channelId, messageId });
    return this;
  }

  removeMessageId(channelId: string) {
    const itemIndex = this.messageIds.findIndex(
      (item) => item.channelId == channelId
    );
    if (itemIndex !== -1) return undefined;
    return this.messageIds.splice(itemIndex, 1)[0];
  }

  hasMessageId(channelId: string) {
    const itemIndex = this.messageIds.findIndex(
      (item) => item.channelId == channelId
    );
    if (itemIndex !== -1) return true;
    return false;
  }

  constructor(id: string, locked: boolean) {
    this.channelId = id;
    this.playerMessageId = "";
    this.isLockedChannel = locked;
    this.messageIds = [];
  }
}

export class Config {
  guildId: string;

  @Type(() => PlayerStateChannels)
  playerChannels!: PlayerStateChannels;

  @Type(() => ConfigChannel)
  logsChannel!: ConfigChannel;

  @Type(() => ConfigChannel)
  voiceChannel!: ConfigChannel;

  logging!: boolean;

  constructor() {
    this.guildId = "";
    this.playerChannels = new PlayerStateChannels("", false);
    this.logsChannel = new ConfigChannel("", false);
    this.voiceChannel = new ConfigChannel("", false);
    this.logging = false;
  }
}
