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

// Sedan, crossover and coupe: their own pictures (1536 × 1024, same pose), each
// traced the same way as the hatchback. Shared below: the wheel targets, built
// from the rims (fitted to the light disc) and the traced tyres.
function wheels(
  rearRim: Flat[],
  frontRim: Flat[],
  rearTyre: Flat[],
  frontTyre: Flat[],
  rear: Flat,
  front: Flat,
  tyreAnchor: Flat,
): Pick<RasterCar["zones"], "tires" | "brakes"> {
  return {
    // Rings: each tyre with its rim cut out (even-odd), as on the wagon.
    tires: {
      polygons: [rearTyre, rearRim, frontTyre, frontRim],
      anchor: tyreAnchor,
      badges: [[rear[0] + 67, rear[1] + 29], [front[0] + 69, front[1] + 30]],
    },
    brakes: {
      polygons: [rearRim, frontRim],
      anchor: front,
      badges: [rear, front],
    },
  };
}

function rasterArt(src: string, crop: RasterCar["crop"], zones: RasterCar["zones"]): RasterCar {
  return { src, width: 1536, height: 1024, crop, zones };
}

// public/images/sedan.webp
// Engines and batteries are parallelograms on the hood's own axes: across, along
// the windscreen's foot; back, along the hood's side edges (the hood climbs to
// the windscreen, so this runs steeper than the sill).
const SEDAN_REAR_TYRE: Flat[] = [[396, 565], [397, 571], [398, 578], [399, 585], [400, 593], [400, 601], [400, 610], [413, 628], [404, 633], [394, 636], [386, 640], [378, 643], [370, 646], [362, 648], [354, 650], [346, 651], [338, 651], [330, 649], [323, 647], [316, 645], [309, 641], [303, 638], [298, 634], [293, 630], [288, 625], [284, 621], [280, 616], [277, 611], [274, 606], [271, 601], [268, 596], [266, 592], [264, 586], [262, 581], [260, 576], [259, 571], [258, 565], [257, 559], [256, 553], [249, 545], [249, 538], [249, 530], [249, 522], [250, 514], [252, 505], [255, 497], [260, 490], [265, 483], [272, 476], [279, 472], [288, 469], [297, 467], [305, 467], [314, 469], [323, 472], [331, 475], [338, 479], [345, 484], [350, 489], [356, 493], [361, 498], [366, 504], [370, 509], [374, 514], [377, 519], [380, 525], [383, 530], [386, 536], [388, 541], [390, 547], [392, 553], [394, 559]];
const SEDAN_FRONT_TYRE: Flat[] = [[935, 755], [936, 762], [938, 770], [938, 778], [939, 787], [939, 796], [939, 806], [938, 816], [936, 826], [927, 830], [918, 834], [910, 838], [901, 842], [893, 845], [885, 847], [876, 848], [868, 848], [859, 847], [851, 846], [843, 843], [836, 840], [829, 836], [823, 832], [817, 827], [812, 822], [808, 817], [803, 812], [799, 807], [796, 801], [792, 796], [790, 790], [787, 785], [785, 779], [782, 773], [781, 767], [779, 761], [770, 755], [769, 748], [768, 740], [768, 732], [768, 724], [769, 716], [770, 708], [772, 699], [775, 691], [778, 682], [783, 674], [789, 666], [796, 660], [805, 655], [813, 651], [823, 649], [832, 648], [842, 649], [851, 651], [860, 654], [868, 657], [876, 662], [883, 667], [890, 672], [896, 678], [901, 684], [906, 690], [910, 696], [914, 702], [918, 708], [921, 714], [924, 721], [927, 727], [929, 734], [931, 741], [933, 748]];
const SEDAN = rasterArt("/images/sedan.webp", { x: 134, y: 126, w: 1240, h: 855 }, {
  engine: {
    polygons: [[[1001, 631], [1189, 553], [1095, 493], [907, 571]]],
    anchor: [1048, 562],
    badges: [[1048, 562]],
  },
  cooling: {
    polygons: [[[1110, 688], [1190, 665], [1250, 642], [1290, 628], [1310, 640], [1322, 665], [1320, 700], [1300, 725], [1250, 748], [1150, 790], [1080, 812], [1040, 817], [1065, 760], [1095, 710]]],
    anchor: [1200, 725],
    badges: [[1200, 725]],
  },
  electrical: {
    polygons: [
      [[1185, 539], [1230, 521], [1193, 497], [1148, 515]],
      [[946, 633], [1000, 642], [1065, 660], [1085, 678], [1100, 698], [1080, 706], [1000, 706], [985, 698], [962, 660]],
      [[1277, 537], [1290, 550], [1305, 590], [1300, 605], [1290, 620], [1283, 625], [1278, 600], [1278, 565]],
      [[192, 345], [205, 333], [212, 348], [247, 366], [243, 377], [220, 388], [194, 402], [188, 390]],
    ],
    anchor: [1189, 518],
    labelAbove: true,
    badges: [[1189, 518]],
  },
  transmission: {
    polygons: [[[778, 558], [858, 556], [940, 628], [950, 680], [778, 626]]],
    anchor: [855, 605],
    badges: [[855, 605]],
  },
  suspension: {
    polygons: [[[428, 603], [570, 655], [765, 733], [765, 765], [430, 648]]],
    anchor: [595, 688],
    badges: [[515, 652]],
  },
  ...wheels(ellipse(323, 565, 43, 54, -15), ellipse(851, 755, 47, 60, -16), SEDAN_REAR_TYRE, SEDAN_FRONT_TYRE, [323, 565], [851, 755], [851, 662]),
});

// public/images/suv.webp. Its arches and sills wear dark cladding, so the tyres
// are traced to the darker rubber only; the sill zone is the cladding strip.
const CROSSOVER_REAR_TYRE: Flat[] = [[395, 582], [397, 589], [398, 597], [399, 605], [400, 613], [400, 622], [421, 644], [413, 651], [403, 656], [393, 660], [384, 664], [374, 667], [366, 670], [357, 673], [348, 674], [340, 675], [331, 674], [323, 673], [315, 670], [307, 667], [300, 664], [294, 660], [288, 656], [282, 651], [278, 646], [273, 642], [269, 637], [265, 632], [262, 627], [259, 621], [255, 616], [253, 611], [251, 605], [248, 600], [246, 594], [245, 588], [243, 582], [242, 576], [241, 569], [232, 560], [232, 552], [232, 543], [232, 534], [233, 525], [235, 515], [238, 506], [243, 496], [249, 488], [256, 481], [265, 476], [275, 473], [284, 469], [296, 474], [305, 476], [315, 478], [324, 481], [332, 485], [339, 489], [347, 493], [352, 501], [358, 507], [363, 513], [368, 519], [372, 525], [375, 531], [379, 537], [381, 544], [384, 550], [387, 556], [389, 562], [391, 569], [393, 575]];
const CROSSOVER_FRONT_TYRE: Flat[] = [[939, 775], [941, 783], [942, 791], [943, 800], [944, 809], [945, 819], [946, 830], [952, 845], [941, 851], [931, 855], [922, 860], [913, 864], [904, 867], [896, 870], [887, 873], [878, 874], [869, 874], [860, 873], [851, 871], [843, 868], [835, 864], [828, 860], [822, 855], [816, 850], [811, 845], [806, 840], [802, 834], [798, 829], [794, 823], [791, 818], [788, 812], [785, 806], [783, 800], [781, 794], [779, 788], [777, 782], [776, 775], [775, 769], [762, 759], [761, 751], [761, 742], [762, 734], [764, 725], [765, 715], [768, 705], [771, 695], [775, 685], [781, 674], [787, 665], [796, 656], [806, 652], [818, 651], [830, 654], [841, 658], [851, 661], [861, 665], [870, 669], [879, 673], [887, 677], [894, 682], [901, 689], [907, 696], [911, 704], [916, 711], [919, 718], [923, 725], [926, 732], [928, 739], [931, 746], [933, 753], [935, 760], [937, 768]];
const CROSSOVER = rasterArt("/images/suv.webp", { x: 140, y: 104, w: 1240, h: 855 }, {
  engine: {
    polygons: [[[1004, 622], [1193, 546], [1096, 490], [907, 566]]],
    anchor: [1050, 556],
    badges: [[1050, 556]],
  },
  // The upper grille and the lower intake, with the bumper strip between.
  cooling: {
    polygons: [[[1135, 668], [1210, 638], [1285, 610], [1305, 618], [1315, 655], [1330, 720], [1340, 750], [1330, 775], [1250, 805], [1150, 840], [1125, 835], [1120, 790], [1140, 740], [1132, 700]]],
    anchor: [1235, 720],
    badges: [[1235, 720]],
  },
  electrical: {
    polygons: [
      [[1189, 533], [1233, 515], [1195, 493], [1151, 511]],
      [[943, 627], [1000, 638], [1080, 650], [1112, 660], [1100, 676], [1065, 688], [1000, 693], [985, 685], [962, 650]],
      [[1290, 515], [1308, 530], [1320, 560], [1333, 570], [1338, 595], [1325, 610], [1307, 600], [1295, 570], [1288, 540]],
      [[202, 335], [215, 318], [225, 316], [227, 328], [262, 350], [255, 360], [215, 385], [203, 387], [200, 370]],
    ],
    anchor: [1192, 513],
    labelAbove: true,
    badges: [[1192, 513]],
  },
  // Above the cladded arch, which rises higher than on the cars.
  transmission: {
    polygons: [[[762, 556], [858, 553], [935, 620], [938, 640], [762, 616]]],
    anchor: [850, 592],
    badges: [[850, 592]],
  },
  suspension: {
    polygons: [[[420, 600], [462, 602], [695, 697], [722, 718], [758, 742], [758, 770], [424, 640]]],
    anchor: [590, 680],
    badges: [[510, 640]],
  },
  ...wheels(ellipse(315, 582, 47, 60, -15), ellipse(851, 775, 51, 65, -16), CROSSOVER_REAR_TYRE, CROSSOVER_FRONT_TYRE, [315, 582], [851, 775], [851, 670]),
});

// public/images/coupe.webp
const COUPE_REAR_TYRE: Flat[] = [[421, 569], [422, 577], [424, 585], [425, 593], [425, 601], [426, 611], [425, 620], [433, 637], [423, 641], [413, 646], [404, 649], [395, 652], [387, 655], [378, 657], [369, 658], [361, 659], [353, 659], [345, 658], [337, 656], [329, 653], [323, 650], [316, 646], [310, 642], [305, 638], [300, 633], [296, 628], [292, 623], [288, 618], [284, 614], [281, 609], [278, 603], [276, 598], [273, 592], [271, 587], [269, 581], [268, 575], [266, 569], [256, 562], [255, 555], [255, 547], [254, 539], [254, 531], [255, 522], [256, 513], [259, 504], [263, 495], [268, 487], [274, 479], [281, 473], [290, 468], [299, 464], [308, 461], [318, 461], [327, 461], [337, 463], [346, 466], [354, 470], [362, 475], [369, 480], [376, 485], [382, 491], [387, 497], [392, 503], [396, 510], [400, 516], [403, 523], [407, 529], [409, 535], [413, 542], [415, 548], [417, 555], [419, 562]];
const COUPE_FRONT_TYRE: Flat[] = [[968, 737], [970, 746], [971, 754], [972, 764], [973, 773], [973, 784], [971, 793], [973, 807], [966, 815], [956, 819], [946, 823], [937, 827], [928, 831], [919, 833], [909, 835], [901, 837], [891, 837], [882, 836], [874, 834], [866, 831], [858, 828], [851, 823], [844, 818], [838, 813], [833, 808], [828, 802], [824, 797], [820, 791], [816, 785], [813, 780], [810, 774], [807, 768], [805, 762], [803, 756], [801, 750], [787, 745], [786, 737], [785, 729], [786, 722], [783, 713], [778, 702], [778, 692], [779, 682], [780, 672], [783, 661], [787, 651], [793, 641], [800, 632], [809, 624], [819, 619], [829, 615], [841, 614], [852, 615], [863, 617], [874, 620], [884, 623], [893, 628], [902, 633], [910, 638], [917, 644], [924, 650], [930, 657], [935, 664], [940, 671], [945, 677], [949, 684], [953, 692], [956, 699], [959, 706], [962, 713], [964, 721], [967, 729]];
const COUPE = rasterArt("/images/coupe.webp", { x: 155, y: 141, w: 1240, h: 855 }, {
  engine: {
    polygons: [[[1006, 603], [1199, 538], [1098, 489], [905, 554]]],
    anchor: [1052, 546],
    badges: [[1052, 546]],
  },
  cooling: {
    polygons: [[[1170, 672], [1250, 640], [1337, 620], [1350, 640], [1345, 660], [1358, 700], [1355, 730], [1260, 770], [1150, 800], [1110, 798], [1130, 765], [1160, 735], [1155, 710]]],
    anchor: [1255, 705],
    badges: [[1255, 705]],
  },
  electrical: {
    polygons: [
      [[1194, 526], [1240, 511], [1200, 491], [1155, 507]],
      [[949, 618], [1000, 622], [1120, 642], [1160, 664], [1155, 676], [1100, 688], [1010, 685], [990, 672], [965, 640]],
      [[1313, 513], [1338, 525], [1356, 555], [1360, 580], [1340, 610], [1328, 600], [1320, 560]],
      [[203, 380], [215, 366], [225, 365], [235, 378], [258, 388], [255, 396], [225, 412], [210, 418], [202, 410]],
    ],
    anchor: [1197, 509],
    labelAbove: true,
    badges: [[1197, 509]],
  },
  // The arch sits high on the coupe, so the wing also takes the panel
  // between the door seam and the arch, under straight edges.
  transmission: {
    polygons: [[[748, 545], [850, 548], [925, 572], [945, 612], [800, 606], [748, 640]]],
    anchor: [820, 580],
    badges: [[820, 580]],
  },
  suspension: {
    polygons: [[[428, 608], [580, 660], [785, 728], [785, 755], [430, 650]]],
    anchor: [605, 690],
    badges: [[520, 650]],
  },
  ...wheels(ellipse(337, 569, 47, 59, -15), ellipse(874, 737, 51, 66, -16), COUPE_REAR_TYRE, COUPE_FRONT_TYRE, [337, 569], [874, 737], [874, 630]),
});

export const RASTER_CARS: Partial<Record<BodyType, RasterCar>> = {
  wagon: WAGON,
  hatchback: HATCHBACK,
  coupe: COUPE,
  sedan: SEDAN,
  crossover: CROSSOVER,
};
