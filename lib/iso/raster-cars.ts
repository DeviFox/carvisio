import type { Flat } from "./iso-kit";
import type { Zone } from "./car";
import type { BodyType } from "@/lib/types";

// Body types drawn as a picture instead of the vector model. Each picture
// carries its own zone map, authored in the picture's pixels: stretching the
// vector zones over a raster never lines up with the drawn parts.

export type RasterZone = {
  // One or more closed shapes sharing one hover/click target (two wheels).
  polygons: Flat[][];
  // Where the hover label sits: centred on the zone, so it reads as naming it.
  anchor: Flat;
  // "above": the label's bottom edge sits on the anchor instead, for zones
  // too small to be covered by their own label (the battery).
  labelAbove?: boolean;
  // One status dot per shape.
  badges: Flat[];
};

export type RasterCar = {
  src: string;
  width: number;
  height: number;
  // The part of the picture shown: the car and its shadow, without the
  // picture's empty margins.
  crop: { x: number; y: number; w: number; h: number };
  zones: Partial<Record<Zone, RasterZone>>;
};

// An ellipse as a polygon, rotated by deg: wheels seen at three quarters.
function ellipse(cx: number, cy: number, rx: number, ry: number, deg: number, n = 36): Flat[] {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    return [Math.round(cx + x * c - y * s), Math.round(cy + x * s + y * c)] as Flat;
  });
}

// public/images/wagon.webp, 1536 × 1024. Front faces right and down.
// Wheels are seen at three quarters: their ellipses lean with the top to the
// left (about -14°). Measured on the picture: the rim (disc and hub) and the
// tyre, traced below.
const REAR_RIM = ellipse(357, 586, 42, 56, -15);
const FRONT_RIM = ellipse(849, 801, 42, 56, -16);
// Tyres are traced from the picture (rays from the hub to the edge of the
// dark rubber), so the zone stops where the wheel arch and the body begin.
const REAR_TYRE: Flat[] = [[430, 586], [432, 593], [433, 599], [433, 606], [434, 614], [434, 622], [434, 630], [434, 640], [432, 649], [424, 653], [416, 656], [408, 659], [401, 663], [394, 666], [387, 668], [379, 669], [371, 668], [364, 667], [357, 665], [350, 661], [344, 658], [339, 654], [334, 650], [329, 646], [325, 642], [321, 638], [318, 633], [314, 629], [312, 624], [308, 620], [306, 615], [304, 611], [301, 606], [300, 601], [298, 596], [296, 591], [295, 586], [293, 580], [293, 575], [292, 569], [283, 559], [283, 552], [284, 544], [284, 535], [286, 527], [289, 518], [293, 509], [298, 502], [305, 496], [313, 491], [321, 488], [330, 487], [340, 488], [349, 490], [357, 493], [365, 497], [372, 501], [379, 505], [385, 510], [390, 515], [395, 520], [400, 524], [404, 530], [408, 535], [412, 540], [415, 546], [418, 551], [420, 557], [423, 562], [425, 568], [427, 574], [429, 580]];
const FRONT_TYRE: Flat[] = [[923, 801], [924, 808], [926, 815], [926, 822], [927, 829], [927, 837], [927, 846], [927, 855], [923, 863], [915, 867], [907, 870], [899, 873], [892, 876], [885, 879], [878, 882], [871, 883], [863, 883], [856, 882], [849, 879], [842, 876], [836, 873], [831, 869], [826, 865], [821, 861], [817, 856], [813, 853], [810, 848], [806, 844], [804, 839], [801, 835], [798, 830], [796, 826], [794, 821], [792, 816], [790, 811], [788, 806], [787, 801], [786, 795], [779, 789], [779, 782], [778, 775], [779, 769], [779, 761], [780, 753], [782, 745], [785, 737], [790, 730], [794, 722], [800, 716], [807, 711], [815, 707], [823, 705], [832, 704], [841, 705], [849, 707], [857, 711], [864, 714], [871, 719], [877, 724], [883, 729], [888, 734], [892, 740], [897, 744], [900, 750], [904, 755], [907, 761], [910, 766], [913, 771], [915, 777], [917, 783], [919, 789], [922, 795]];

const WAGON: RasterCar = {
  src: "/images/wagon.webp",
  width: 1536,
  height: 1024,
  crop: { x: 180, y: 140, w: 1160, h: 800 },
  zones: {
    // Under the hood. The hood is mapped as a grid (u along its front edge,
    // v from the front edge back to the windscreen): the engine keeps the
    // middle and the back, the front strip stays clear, and the near front
    // corner on the car's left is the battery's (part of the electrics).
    engine: {
      polygons: [[[965, 679], [1214, 571], [1094, 517], [877, 612]]],
      anchor: [1037, 595],
      badges: [[1037, 595]],
    },
    // Behind the grille: the grille and the lower intake.
    cooling: {
      polygons: [[[1080, 706], [1240, 640], [1256, 770], [1094, 838]]],
      anchor: [1168, 738],
      badges: [[1168, 738]],
    },
    // The electrics as the owner meets them: the battery under the hood on the
    // car's left (the far front corner here: the car faces right and down, so
    // its near side is its right), the headlights and the tail light.
    electrical: {
      polygons: [
        [[1191, 623], [1261, 593], [1227, 577], [1159, 606]],
        [[947, 715], [987, 714], [1057, 716], [1072, 755], [1052, 763], [1007, 767], [974, 773], [952, 750]],
        [[1249, 630], [1283, 603], [1296, 648], [1294, 662], [1252, 679]],
        [[219, 346], [278, 284], [292, 296], [237, 354], [236, 428], [215, 415]],
      ],
      anchor: [1193, 592],
      labelAbove: true,
      // One dot, on the battery: a second on the tail light read as a second fault.
      badges: [[1210, 600]],
    },
    // Right behind the engine: the front wing between the pillar and the wheel,
    // clear of the sill that stands for the suspension.
    transmission: {
      polygons: [[[802, 635], [840, 623], [947, 693], [950, 715], [917, 723], [877, 703], [817, 700], [800, 693]]],
      anchor: [872, 675],
      badges: [[872, 675]],
    },
    suspension: {
      polygons: [[[440, 600], [588, 663], [775, 742], [775, 770], [440, 644]]],
      anchor: [600, 690],
      badges: [[520, 650]],
    },
    // Rings: each tyre with its rim cut out (even-odd), so the disc stays the
    // brakes' target.
    tires: {
      polygons: [REAR_TYRE, REAR_RIM, FRONT_TYRE, FRONT_RIM],
      anchor: [855, 712],
      badges: [[424, 614], [918, 831]],
    },
    brakes: {
      polygons: [REAR_RIM, FRONT_RIM],
      anchor: [849, 801],
      badges: [[357, 586], [849, 801]],
    },
  },
};

// public/images/hatchback.webp, 1536 × 1024, drawn in the same pose as the
// wagon but its own picture: the wheels sit further forward and higher at the
// front, the hood is shorter and the lamps differ, so every zone is traced anew.
const HATCHBACK_REAR_RIM = ellipse(337, 588, 43, 55, -15);
const HATCHBACK_FRONT_RIM = ellipse(829, 764, 45, 58, -16);
// Traced like the wagon's: rays from the hub to the edge of the dark rubber.
const HATCHBACK_REAR_TYRE: Flat[] = [[412, 588], [413, 595], [414, 602], [415, 610], [416, 618], [416, 626], [416, 635], [424, 650], [414, 654], [405, 658], [396, 661], [388, 664], [381, 667], [373, 669], [366, 671], [358, 672], [350, 671], [343, 670], [336, 668], [329, 665], [323, 662], [317, 659], [312, 654], [307, 650], [302, 646], [298, 642], [295, 637], [291, 633], [288, 628], [285, 624], [282, 619], [280, 614], [278, 609], [276, 604], [274, 599], [273, 594], [271, 588], [270, 583], [270, 577], [269, 571], [260, 561], [260, 553], [260, 545], [261, 536], [264, 528], [267, 520], [272, 512], [277, 505], [284, 499], [292, 495], [301, 493], [310, 491], [319, 491], [327, 492], [336, 495], [344, 498], [351, 502], [358, 506], [364, 510], [369, 516], [375, 520], [379, 526], [384, 531], [388, 536], [392, 541], [395, 547], [398, 552], [401, 558], [403, 564], [406, 570], [408, 576], [410, 582]];
const HATCHBACK_FRONT_TYRE: Flat[] = [[913, 764], [914, 771], [915, 779], [916, 787], [917, 796], [917, 805], [917, 815], [921, 829], [911, 833], [902, 837], [893, 841], [885, 845], [877, 848], [869, 850], [861, 853], [853, 854], [844, 853], [836, 852], [828, 850], [821, 848], [814, 844], [808, 841], [802, 837], [797, 832], [792, 827], [787, 823], [783, 818], [779, 813], [776, 808], [773, 803], [770, 798], [767, 792], [765, 787], [763, 781], [761, 776], [759, 770], [758, 764], [748, 757], [747, 750], [746, 742], [746, 734], [747, 726], [748, 717], [750, 709], [752, 700], [756, 691], [761, 683], [767, 676], [774, 670], [782, 665], [792, 662], [800, 659], [810, 659], [819, 660], [828, 662], [837, 665], [845, 668], [853, 673], [860, 678], [866, 683], [872, 688], [877, 695], [882, 700], [886, 706], [890, 712], [894, 718], [898, 724], [901, 730], [904, 736], [906, 743], [909, 750], [911, 757]];

const HATCHBACK: RasterCar = {
  src: "/images/hatchback.webp",
  width: 1536,
  height: 1024,
  crop: { x: 180, y: 140, w: 1160, h: 800 },
  zones: {
    // Same hood grid as the wagon: the engine keeps the middle and the back,
    // the far front corner is the battery's.
    engine: {
      polygons: [[[944, 609], [1137, 551], [1071, 497], [903, 566]]],
      anchor: [1015, 556],
      badges: [[1015, 556]],
    },
    // The grille and the lower intake: one dark mouth on this car.
    cooling: {
      polygons: [[[1100, 680], [1200, 655], [1215, 635], [1240, 640], [1260, 665], [1268, 700], [1240, 730], [1170, 765], [1100, 790], [1035, 812], [1027, 805], [1060, 740], [1090, 700]]],
      anchor: [1160, 715],
      badges: [[1160, 715]],
    },
    // Battery, both headlights and the tail light.
    electrical: {
      polygons: [
        [[1138, 540], [1179, 527], [1131, 493], [1094, 506]],
        [[893, 606], [1022, 630], [1045, 645], [1068, 682], [1058, 694], [955, 695], [940, 670], [920, 630]],
        [[1210, 505], [1232, 520], [1256, 568], [1250, 585], [1232, 608], [1222, 600], [1215, 560], [1206, 528]],
        [[270, 350], [288, 340], [293, 352], [320, 369], [315, 378], [285, 398], [268, 413], [266, 370]],
      ],
      anchor: [1136, 516],
      labelAbove: true,
      badges: [[1136, 516]],
    },
    // The front wing between the door seam and the headlight, above the arch.
    transmission: {
      polygons: [[[770, 594], [835, 592], [886, 608], [906, 645], [916, 676], [772, 640]]],
      anchor: [840, 625],
      badges: [[840, 625]],
    },
    suspension: {
      polygons: [[[426, 600], [568, 650], [745, 725], [745, 760], [428, 645]]],
      anchor: [590, 680],
      badges: [[510, 645]],
    },
    tires: {
      polygons: [HATCHBACK_REAR_TYRE, HATCHBACK_REAR_RIM, HATCHBACK_FRONT_TYRE, HATCHBACK_FRONT_RIM],
      anchor: [835, 675],
      badges: [[404, 618], [902, 798]],
    },
    brakes: {
      polygons: [HATCHBACK_REAR_RIM, HATCHBACK_FRONT_RIM],
      anchor: [829, 764],
      badges: [[337, 588], [829, 764]],
    },
  },
};

export const RASTER_CARS: Partial<Record<BodyType, RasterCar>> = {
  wagon: WAGON,
  hatchback: HATCHBACK,
};
