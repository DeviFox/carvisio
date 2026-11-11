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
// The picture was redrawn (cut out, larger, a longer wheelbase); the zones
// were carried over by an affine fit on the wheel hubs and body extremes, the
// rims re-measured and the lamps re-traced on the new picture.
// Wheels are seen at three quarters: their ellipses lean with the top to the
// left (about -14°). Measured on the picture: the rim (disc and hub) and the
// tyre, traced below.
const REAR_RIM = ellipse(250, 608, 54, 72, -15);
const FRONT_RIM = ellipse(886, 824, 58, 77, -16);
// Tyres are traced from the picture (rays from the hub to the edge of the
// dark rubber), so the zone stops where the wheel arch and the body begin.
const REAR_TYRE: Flat[] = [[349, 601], [351, 609], [352, 616], [351, 624], [352, 633], [351, 642], [350, 651], [349, 663], [346, 673], [335, 678], [324, 682], [313, 686], [304, 690], [294, 694], [285, 697], [274, 698], [264, 697], [255, 696], [246, 694], [237, 690], [229, 687], [223, 683], [216, 678], [210, 674], [205, 670], [200, 665], [197, 660], [192, 655], [189, 649], [185, 645], [182, 639], [180, 635], [176, 629], [176, 624], [173, 618], [171, 612], [170, 607], [168, 600], [168, 594], [168, 587], [157, 576], [157, 568], [159, 559], [160, 549], [163, 540], [168, 529], [174, 519], [181, 511], [191, 503], [202, 497], [213, 494], [225, 492], [238, 493], [250, 495], [260, 498], [270, 502], [279, 506], [288, 511], [295, 516], [302, 522], [308, 527], [314, 532], [319, 538], [324, 544], [329, 549], [332, 556], [336, 562], [338, 568], [341, 574], [344, 581], [346, 588], [348, 594]];
const FRONT_TYRE: Flat[] = [[982, 827], [983, 835], [985, 843], [985, 851], [985, 859], [985, 868], [984, 878], [983, 888], [977, 898], [966, 903], [956, 906], [945, 910], [935, 914], [926, 918], [916, 921], [907, 923], [896, 923], [887, 922], [878, 919], [869, 916], [862, 913], [855, 908], [849, 904], [843, 900], [838, 894], [833, 891], [829, 885], [824, 881], [822, 875], [818, 871], [815, 865], [813, 861], [810, 855], [808, 849], [806, 844], [804, 838], [803, 832], [802, 826], [793, 819], [794, 811], [793, 803], [795, 796], [795, 787], [797, 778], [801, 769], [805, 759], [813, 751], [819, 742], [827, 735], [837, 729], [848, 724], [858, 721], [870, 720], [882, 720], [892, 722], [903, 727], [912, 730], [921, 735], [928, 741], [936, 746], [942, 752], [947, 758], [953, 763], [956, 769], [961, 775], [965, 782], [968, 787], [972, 793], [974, 800], [976, 806], [978, 813], [982, 820]];

const WAGON: RasterCar = {
  src: "/images/wagon.webp",
  width: 1536,
  height: 1024,
  crop: { x: 48, y: 90, w: 1460, h: 864 },
  zones: {
    // Under the hood. The hood is mapped as a grid (u along its front edge,
    // v from the front edge back to the windscreen): the engine keeps the
    // middle and the back, the front strip stays clear, and the near front
    // corner on the car's left is the battery's (part of the electrics).
    engine: {
      polygons: [[[1099, 666], [1278, 595], [1138, 533], [981, 595]]],
      anchor: [1125, 598],
      badges: [[1125, 598]],
    },
    // Behind the grille: the grille and the lower intake.
    cooling: {
      polygons: [[[1198, 712], [1415, 630], [1425, 778], [1205, 862]]],
      anchor: [1312, 745],
      badges: [[1312, 745]],
    },
    // The electrics as the owner meets them: the battery under the hood on the
    // car's left (the far front corner here: the car faces right and down, so
    // its near side is its right), the headlights and the tail light.
    electrical: {
      polygons: [
        [[1352, 612], [1430, 581], [1400, 559], [1311, 594]],
        [[1020, 690], [1100, 697], [1162, 699], [1182, 712], [1200, 752], [1185, 762], [1103, 765], [1050, 752], [1025, 710]],
        [[1437, 587], [1446, 590], [1469, 646], [1462, 661], [1424, 692], [1417, 686], [1412, 628]],
        [[197, 213], [100, 306], [86, 330], [82, 408], [108, 419], [118, 313], [196, 242]],
      ],
      anchor: [1357, 577],
      labelAbove: true,
      // One dot, on the battery: a second on the tail light read as a second fault.
      badges: [[1379, 585]],
    },
    // The gearbox as a box inside the body, right behind the engine, above
    // the front wheel and clear of the sill that stands for the suspension.
    // The other cars carry this box over (see their transmission zones).
    transmission: {
      polygons: [[[836, 642], [888, 627], [1023, 702], [1025, 727], [981, 738], [930, 717], [851, 716], [829, 708]]],
      anchor: [926, 685],
      badges: [[926, 685]],
    },
    suspension: {
      polygons: [[[361, 617], [551, 683], [792, 765], [789, 797], [357, 667]]],
      anchor: [565, 713],
      badges: [[462, 671]],
    },
    // Rings: each tyre with its rim cut out (even-odd), so the disc stays the
    // brakes' target.
    tires: {
      polygons: [REAR_TYRE, REAR_RIM, FRONT_TYRE, FRONT_RIM],
      anchor: [900, 728],
      badges: [[338, 633], [973, 861]],
    },
    brakes: {
      polygons: [REAR_RIM, FRONT_RIM],
      anchor: [886, 824],
      badges: [[250, 608], [886, 824]],
    },
  },
};

// public/images/hatchback.webp, 1536 × 1024 (redrawn and cut out; zones
// carried over by an affine fit on the wheel hubs), drawn in the same pose as the
// wagon but its own picture: the wheels sit further forward and higher at the
// front, the hood is shorter and the lamps differ, so every zone is traced anew.
const HATCHBACK_REAR_RIM = ellipse(297, 613, 47, 58, -15);
const HATCHBACK_FRONT_RIM = ellipse(833, 793, 49, 61, -16);
// Traced like the wagon's: rays from the hub to the edge of the dark rubber.
const HATCHBACK_REAR_TYRE: Flat[] = [[379, 612], [380, 619], [381, 627], [382, 635], [383, 643], [383, 652], [382, 661], [391, 677], [380, 681], [370, 686], [360, 689], [351, 692], [343, 695], [334, 697], [327, 699], [318, 701], [309, 700], [301, 699], [294, 697], [286, 693], [280, 690], [273, 687], [268, 682], [262, 678], [257, 674], [253, 670], [249, 664], [245, 660], [242, 655], [239, 651], [236, 646], [233, 640], [231, 635], [229, 630], [227, 625], [226, 619], [224, 613], [223, 608], [223, 602], [222, 595], [213, 585], [213, 576], [213, 568], [215, 559], [218, 550], [221, 542], [227, 533], [233, 526], [241, 520], [250, 515], [259, 513], [269, 511], [279, 511], [288, 512], [298, 515], [307, 518], [314, 522], [322, 526], [328, 531], [334, 537], [340, 541], [344, 547], [350, 552], [354, 558], [358, 563], [361, 569], [365, 574], [368, 581], [370, 587], [373, 593], [375, 599], [377, 606]];
const HATCHBACK_FRONT_TYRE: Flat[] = [[925, 793], [926, 800], [927, 808], [928, 817], [929, 826], [928, 836], [928, 846], [932, 861], [921, 865], [911, 869], [901, 874], [892, 878], [883, 881], [875, 883], [866, 887], [857, 888], [847, 887], [838, 886], [830, 884], [822, 882], [814, 877], [808, 874], [801, 870], [796, 865], [791, 860], [785, 856], [781, 850], [777, 845], [773, 840], [770, 835], [767, 830], [764, 823], [762, 818], [760, 812], [758, 807], [756, 800], [755, 794], [744, 787], [743, 779], [742, 771], [742, 763], [744, 754], [745, 745], [747, 736], [750, 727], [754, 717], [760, 709], [767, 702], [775, 695], [783, 690], [795, 687], [803, 683], [814, 683], [824, 684], [834, 686], [844, 689], [853, 693], [861, 698], [869, 703], [875, 708], [882, 713], [887, 721], [892, 726], [897, 732], [901, 738], [905, 745], [909, 751], [913, 757], [916, 763], [918, 771], [921, 778], [923, 785]];

const HATCHBACK: RasterCar = {
  src: "/images/hatchback.webp",
  width: 1536,
  height: 1024,
  crop: { x: 170, y: 157, w: 1182, h: 753 },
  zones: {
    // Same hood grid as the wagon: the engine keeps the middle and the back,
    // the far front corner is the battery's.
    engine: {
      polygons: [[[963, 630], [1176, 568], [1105, 511], [919, 585]]],
      anchor: [1042, 574],
      badges: [[1042, 574]],
    },
    // The grille and the lower intake: one dark mouth on this car.
    cooling: {
      polygons: [[[1132, 703], [1243, 676], [1260, 655], [1287, 660], [1308, 686], [1316, 723], [1285, 755], [1207, 792], [1130, 819], [1058, 842], [1049, 835], [1087, 766], [1121, 724]]],
      anchor: [1197, 739],
      badges: [[1197, 739]],
    },
    // Battery, both headlights and the tail light.
    electrical: {
      polygons: [
        [[1177, 556], [1223, 542], [1171, 507], [1130, 521]],
        [[907, 627], [1048, 651], [1073, 667], [1097, 706], [1086, 718], [973, 720], [957, 694], [936, 652]],
        [[1257, 519], [1281, 534], [1306, 584], [1299, 602], [1279, 627], [1268, 618], [1262, 576], [1252, 543]],
        [[229, 363], [249, 353], [254, 365], [283, 383], [278, 392], [244, 414], [225, 430], [224, 384]],
      ],
      anchor: [1176, 531],
      labelAbove: true,
      badges: [[1176, 531]],
    },
    // The gearbox as a box inside the body, behind the engine: the wagon's
    // box, carried over by the affine map through both hubs and the
    // headlight's rear corner, so it keeps its faces parallel.
    transmission: {
      polygons: [[[755, 591], [792, 569], [912, 640], [919, 669], [887, 686], [844, 667], [783, 674], [764, 667]]],
      anchor: [827, 633],
      badges: [[827, 633]],
    },
    suspension: {
      polygons: [[[394, 625], [549, 676], [741, 753], [741, 790], [395, 672]]],
      anchor: [572, 707],
      badges: [[485, 671]],
    },
    tires: {
      polygons: [HATCHBACK_REAR_TYRE, HATCHBACK_REAR_RIM, HATCHBACK_FRONT_TYRE, HATCHBACK_FRONT_RIM],
      anchor: [841, 700],
      badges: [[370, 644], [912, 829]],
    },
    brakes: {
      polygons: [HATCHBACK_REAR_RIM, HATCHBACK_FRONT_RIM],
      anchor: [833, 793],
      badges: [[297, 613], [833, 793]],
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
  // The gearbox as a box inside the body, behind the engine: the wagon's
  // box, carried over by the affine map through both hubs and the
  // headlight's rear corner, so it keeps its faces parallel.
  transmission: {
    polygons: [[[795, 591], [835, 577], [949, 644], [953, 666], [919, 677], [876, 658], [813, 658], [795, 651]]],
    anchor: [863, 630],
    badges: [[863, 630]],
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
  // The gearbox as a box inside the body, behind the engine: the wagon's
  // box, carried over by the affine map through both hubs and the
  // headlight's rear corner, so it keeps its faces parallel.
  transmission: {
    polygons: [[[790, 586], [830, 568], [947, 639], [951, 666], [917, 680], [874, 660], [810, 663], [792, 656]]],
    anchor: [860, 628],
    badges: [[860, 628]],
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
  // The gearbox as a box inside the body, behind the engine: the wagon's
  // box, carried over by the affine map through both hubs and the
  // headlight's rear corner, so it keeps its faces parallel.
  transmission: {
    polygons: [[[797, 582], [834, 568], [954, 628], [961, 650], [929, 660], [885, 644], [824, 645], [805, 639]]],
    anchor: [869, 618],
    badges: [[869, 618]],
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
