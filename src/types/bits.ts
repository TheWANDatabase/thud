export class Features {
  youtube: boolean;
  bingo: boolean;
  live: boolean;
  conflictResolution: boolean;

  constructor(youtube: boolean, bingo: boolean, live: boolean, conflictResolution: boolean) {
    this.youtube = youtube;
    this.bingo = bingo;
    this.live = live;
    this.conflictResolution = conflictResolution;
  }

  toInt(): number {
    return (this.youtube ? 0x1 : 0) |
      (this.bingo ? 0x2 : 0) |
      (this.live ? 0x4 : 0) |
      (this.conflictResolution ? 0x8 : 0);
  }
}