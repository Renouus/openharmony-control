export interface Room {
  id: string;
  name: string;
  icon: string;
  builtIn: boolean;
  createdAt: number;
}

export class RoomRegistry {
  private readonly rooms = new Map<string, Room>();

  constructor(now = Date.now()) {
    this.seed(now);
  }

  private seed(now: number): void {
    this.rooms.set("entry", { id: "entry", name: "入户", icon: "lock", builtIn: true, createdAt: now });
    this.rooms.set("living-room", { id: "living-room", name: "客厅", icon: "home", builtIn: true, createdAt: now });
    this.rooms.set("kitchen", { id: "kitchen", name: "厨房", icon: "restaurant", builtIn: true, createdAt: now });
    this.rooms.set("bedroom", { id: "bedroom", name: "卧室", icon: "bedtime", builtIn: true, createdAt: now });
    this.rooms.set("bathroom", { id: "bathroom", name: "浴室", icon: "self_care", builtIn: true, createdAt: now });
  }

  list(): Room[] {
    return [...this.rooms.values()].sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
  }

  find(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  create(name: string, icon: string): Room {
    const slug = name.replace(/\s+/g, "-").toLowerCase();
    const id = `custom-${slug}-${Date.now()}`;
    const room: Room = { id, name, icon, builtIn: false, createdAt: Date.now() };
    this.rooms.set(id, room);
    return room;
  }

  update(id: string, name?: string, icon?: string): Room | undefined {
    const room = this.rooms.get(id);
    if (!room || room.builtIn) return undefined;
    if (name !== undefined) room.name = name;
    if (icon !== undefined) room.icon = icon;
    return room;
  }

  /** Returns false if room is built-in or not found */
  delete(id: string): boolean {
    const room = this.rooms.get(id);
    if (!room || room.builtIn) return false;
    this.rooms.delete(id);
    return true;
  }
}
