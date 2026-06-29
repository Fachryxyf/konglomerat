import type { BoardSpace, PropertySpace, RailroadSpace, UtilitySpace } from "./types";

// Original board theme — the fictional metropolis "Kota Raya". 40 spaces (0..39).
// Layout, prices & rents mirror a classic 40-tile economy board (game mechanics
// aren't copyrightable), but every NAME is original IP (see docs rebrand plan).
// 0 = MULAI (GO), 10 = Penjara, 20 = Parkir Bebas, 30 = Masuk Penjara.

export const BOARD: BoardSpace[] = [
  // 0
  { index: 0, type: "GO", name: "MULAI" },
  // 1 - Gang Mawar (Brown)
  {
    index: 1,
    type: "PROPERTY",
    name: "Gang Mawar",
    colorSet: "Brown",
    price: 60,
    rent: [2, 10, 30, 90, 160, 250],
    housePrice: 50,
    mortgageValue: 30,
  },
  // 2
  { index: 2, type: "COMMUNITY_CHEST", name: "Dana Umum" },
  // 3 - Kampung Melati (Brown)
  {
    index: 3,
    type: "PROPERTY",
    name: "Kampung Melati",
    colorSet: "Brown",
    price: 60,
    rent: [4, 20, 60, 180, 320, 450],
    housePrice: 50,
    mortgageValue: 30,
  },
  // 4
  { index: 4, type: "TAX", name: "Pajak Penghasilan", taxType: "INCOME", amount: 200 },
  // 5 - Stasiun Sentral
  {
    index: 5,
    type: "RAILROAD",
    name: "Stasiun Sentral",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  // 6 - Pasar Lama (Light Blue)
  {
    index: 6,
    type: "PROPERTY",
    name: "Pasar Lama",
    colorSet: "LightBlue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    housePrice: 50,
    mortgageValue: 50,
  },
  // 7
  { index: 7, type: "CHANCE", name: "Kesempatan" },
  // 8 - Jalan Kenanga (Light Blue)
  {
    index: 8,
    type: "PROPERTY",
    name: "Jalan Kenanga",
    colorSet: "LightBlue",
    price: 100,
    rent: [6, 30, 90, 270, 400, 550],
    housePrice: 50,
    mortgageValue: 50,
  },
  // 9 - Bukit Cemara (Light Blue)
  {
    index: 9,
    type: "PROPERTY",
    name: "Bukit Cemara",
    colorSet: "LightBlue",
    price: 120,
    rent: [8, 40, 100, 300, 450, 600],
    housePrice: 50,
    mortgageValue: 60,
  },
  // 10
  { index: 10, type: "JAIL", name: "Penjara / Mampir" },
  // 11 - Alun-Alun Timur (Pink)
  {
    index: 11,
    type: "PROPERTY",
    name: "Alun-Alun Timur",
    colorSet: "Pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    housePrice: 100,
    mortgageValue: 70,
  },
  // 12 - Pembangkit Listrik (Utility)
  {
    index: 12,
    type: "UTILITY",
    name: "Pembangkit Listrik",
    price: 150,
    multiplier: [4, 10],
    mortgageValue: 75,
  },
  // 13 - Taman Anggrek (Pink)
  {
    index: 13,
    type: "PROPERTY",
    name: "Taman Anggrek",
    colorSet: "Pink",
    price: 140,
    rent: [10, 50, 150, 450, 625, 750],
    housePrice: 100,
    mortgageValue: 70,
  },
  // 14 - Jalan Cendana (Pink)
  {
    index: 14,
    type: "PROPERTY",
    name: "Jalan Cendana",
    colorSet: "Pink",
    price: 160,
    rent: [12, 60, 180, 500, 700, 900],
    housePrice: 100,
    mortgageValue: 80,
  },
  // 15 - Pelabuhan Samudra
  {
    index: 15,
    type: "RAILROAD",
    name: "Pelabuhan Samudra",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  // 16 - Pasar Baru (Orange)
  {
    index: 16,
    type: "PROPERTY",
    name: "Pasar Baru",
    colorSet: "Orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    housePrice: 100,
    mortgageValue: 90,
  },
  // 17
  { index: 17, type: "COMMUNITY_CHEST", name: "Dana Umum" },
  // 18 - Simpang Lima (Orange)
  {
    index: 18,
    type: "PROPERTY",
    name: "Simpang Lima",
    colorSet: "Orange",
    price: 180,
    rent: [14, 70, 200, 550, 750, 950],
    housePrice: 100,
    mortgageValue: 90,
  },
  // 19 - Jalan Merdeka (Orange)
  {
    index: 19,
    type: "PROPERTY",
    name: "Jalan Merdeka",
    colorSet: "Orange",
    price: 200,
    rent: [16, 80, 220, 600, 800, 1000],
    housePrice: 100,
    mortgageValue: 100,
  },
  // 20
  { index: 20, type: "FREE_PARKING", name: "Parkir Bebas" },
  // 21 - Bulevar Garuda (Red)
  {
    index: 21,
    type: "PROPERTY",
    name: "Bulevar Garuda",
    colorSet: "Red",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    housePrice: 150,
    mortgageValue: 110,
  },
  // 22
  { index: 22, type: "CHANCE", name: "Kesempatan" },
  // 23 - Plaza Senja (Red)
  {
    index: 23,
    type: "PROPERTY",
    name: "Plaza Senja",
    colorSet: "Red",
    price: 220,
    rent: [18, 90, 250, 700, 875, 1050],
    housePrice: 150,
    mortgageValue: 110,
  },
  // 24 - Jalan Mahkota (Red)
  {
    index: 24,
    type: "PROPERTY",
    name: "Jalan Mahkota",
    colorSet: "Red",
    price: 240,
    rent: [20, 100, 300, 750, 925, 1100],
    housePrice: 150,
    mortgageValue: 120,
  },
  // 25 - Bandara Internasional
  {
    index: 25,
    type: "RAILROAD",
    name: "Bandara Internasional",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  // 26 - Menara Kencana (Yellow)
  {
    index: 26,
    type: "PROPERTY",
    name: "Menara Kencana",
    colorSet: "Yellow",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    housePrice: 150,
    mortgageValue: 130,
  },
  // 27 - Bulevar Mutiara (Yellow)
  {
    index: 27,
    type: "PROPERTY",
    name: "Bulevar Mutiara",
    colorSet: "Yellow",
    price: 260,
    rent: [22, 110, 330, 800, 975, 1150],
    housePrice: 150,
    mortgageValue: 130,
  },
  // 28 - Perusahaan Air (Utility)
  {
    index: 28,
    type: "UTILITY",
    name: "Perusahaan Air",
    price: 150,
    multiplier: [4, 10],
    mortgageValue: 75,
  },
  // 29 - Taman Safir (Yellow)
  {
    index: 29,
    type: "PROPERTY",
    name: "Taman Safir",
    colorSet: "Yellow",
    price: 280,
    rent: [24, 120, 360, 850, 1025, 1200],
    housePrice: 150,
    mortgageValue: 140,
  },
  // 30
  { index: 30, type: "GO_TO_JAIL", name: "Masuk Penjara" },
  // 31 - Distrik Zamrud (Green)
  {
    index: 31,
    type: "PROPERTY",
    name: "Distrik Zamrud",
    colorSet: "Green",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    housePrice: 200,
    mortgageValue: 150,
  },
  // 32 - Menara Cakrawala (Green)
  {
    index: 32,
    type: "PROPERTY",
    name: "Menara Cakrawala",
    colorSet: "Green",
    price: 300,
    rent: [26, 130, 390, 900, 1100, 1275],
    housePrice: 200,
    mortgageValue: 150,
  },
  // 33
  { index: 33, type: "COMMUNITY_CHEST", name: "Dana Umum" },
  // 34 - Bulevar Berlian (Green)
  {
    index: 34,
    type: "PROPERTY",
    name: "Bulevar Berlian",
    colorSet: "Green",
    price: 320,
    rent: [28, 150, 450, 1000, 1200, 1400],
    housePrice: 200,
    mortgageValue: 160,
  },
  // 35 - Terminal Ekspres
  {
    index: 35,
    type: "RAILROAD",
    name: "Terminal Ekspres",
    price: 200,
    rent: [25, 50, 100, 200],
    mortgageValue: 100,
  },
  // 36
  { index: 36, type: "CHANCE", name: "Kesempatan" },
  // 37 - Puri Kencana (Dark Blue)
  {
    index: 37,
    type: "PROPERTY",
    name: "Puri Kencana",
    colorSet: "DarkBlue",
    price: 350,
    rent: [35, 175, 500, 1100, 1300, 1500],
    housePrice: 200,
    mortgageValue: 175,
  },
  // 38
  { index: 38, type: "TAX", name: "Pajak Kemewahan", taxType: "LUXURY", amount: 100 },
  // 39 - Menara Nirwana (Dark Blue)
  {
    index: 39,
    type: "PROPERTY",
    name: "Menara Nirwana",
    colorSet: "DarkBlue",
    price: 400,
    rent: [50, 200, 600, 1400, 1700, 2000],
    housePrice: 200,
    mortgageValue: 200,
  },
];

export const COLOR_SETS: Record<string, number[]> = {
  Brown: [1, 3],
  LightBlue: [6, 8, 9],
  Pink: [11, 13, 14],
  Orange: [16, 18, 19],
  Red: [21, 23, 24],
  Yellow: [26, 27, 29],
  Green: [31, 32, 34],
  DarkBlue: [37, 39],
};

export const COLOR_HEX: Record<string, string> = {
  Brown: "#8B4513",
  LightBlue: "#87CEEB",
  Pink: "#FF69B4",
  Orange: "#FFA500",
  Red: "#DC143C",
  Yellow: "#FFD700",
  Green: "#228B22",
  DarkBlue: "#00008B",
};

export const JAIL_INDEX = 10;
export const GO_INDEX = 0;

export function getProperty(space: BoardSpace): PropertySpace | null {
  if (space.type === "PROPERTY") return space as PropertySpace;
  return null;
}

export function getRailroad(space: BoardSpace): RailroadSpace | null {
  if (space.type === "RAILROAD") return space as RailroadSpace;
  return null;
}

export function getUtility(space: BoardSpace): UtilitySpace | null {
  if (space.type === "UTILITY") return space as UtilitySpace;
  return null;
}

export function isPurchasable(space: BoardSpace): boolean {
  return space.type === "PROPERTY" || space.type === "RAILROAD" || space.type === "UTILITY";
}

export function getPrice(space: BoardSpace): number {
  if (space.type === "PROPERTY") return (space as PropertySpace).price;
  if (space.type === "RAILROAD") return (space as RailroadSpace).price;
  if (space.type === "UTILITY") return (space as UtilitySpace).price;
  return 0;
}

export function getMortgageValue(space: BoardSpace): number {
  if (space.type === "PROPERTY") return (space as PropertySpace).mortgageValue;
  if (space.type === "RAILROAD") return (space as RailroadSpace).mortgageValue;
  if (space.type === "UTILITY") return (space as UtilitySpace).mortgageValue;
  return 0;
}
