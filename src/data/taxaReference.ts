export interface TaxonReference {
  classId: number;
  name: string;
  rank: 'Order' | 'Class';
  phylum: 'Chordata' | 'Arthropoda' | 'Mollusca';
  subphylumOrClass: string;
  lineage: string[];
  exampleSpecies: string[];
  habitatNote: string;
  trainingCount: number;
}

export const TAXA_REFERENCE: TaxonReference[] = [
  {
    classId: 0,
    name: 'Perciformes',
    rank: 'Order',
    phylum: 'Chordata',
    subphylumOrClass: 'Actinopterygii',
    lineage: ['Animalia', 'Chordata', 'Actinopterygii', 'Perciformes'],
    exampleSpecies: ['Paracottus knerii', 'Chelidonichthys kumu', 'Serranus cabrilla'],
    habitatNote: 'Diverse ray-finned marine fishes spanning coastal reefs to bathydemersal shelves.',
    trainingCount: 10000,
  },
  {
    classId: 1,
    name: 'Salmoniformes',
    rank: 'Order',
    phylum: 'Chordata',
    subphylumOrClass: 'Actinopterygii',
    lineage: ['Animalia', 'Chordata', 'Actinopterygii', 'Salmoniformes'],
    exampleSpecies: ['Salmo salar', 'Oncorhynchus kisutch', 'Salvelinus alpinus'],
    habitatNote: 'Anadromous and cold-water pelagic fishes tracked across estuarine and North Pacific transects.',
    trainingCount: 5000,
  },
  {
    classId: 2,
    name: 'Clupeiformes',
    rank: 'Order',
    phylum: 'Chordata',
    subphylumOrClass: 'Actinopterygii',
    lineage: ['Animalia', 'Chordata', 'Actinopterygii', 'Clupeiformes'],
    exampleSpecies: ['Clupea harengus', 'Engraulis encrasicolus', 'Sardina pilchardus'],
    habitatNote: 'Epipelagic schooling forage fishes serving as keystone trophic links in upwelling zones.',
    trainingCount: 5000,
  },
  {
    classId: 3,
    name: 'Gadiformes',
    rank: 'Order',
    phylum: 'Chordata',
    subphylumOrClass: 'Actinopterygii',
    lineage: ['Animalia', 'Chordata', 'Actinopterygii', 'Gadiformes'],
    exampleSpecies: ['Gadus morhua', 'Melanogrammus aeglefinus', 'Macrourus berglax'],
    habitatNote: 'Demersal and abyssal-slope cods and grenadiers inhabiting continental margins to 3,000 m.',
    trainingCount: 5000,
  },
  {
    classId: 4,
    name: 'Pleuronectiformes',
    rank: 'Order',
    phylum: 'Chordata',
    subphylumOrClass: 'Actinopterygii',
    lineage: ['Animalia', 'Chordata', 'Actinopterygii', 'Pleuronectiformes'],
    exampleSpecies: ['Pleuronectes platessa', 'Solea solea', 'Hippoglossus hippoglossus'],
    habitatNote: 'Benthic flatfishes closely associated with sedimentary marine substrates.',
    trainingCount: 3000,
  },
  {
    classId: 5,
    name: 'Decapoda',
    rank: 'Order',
    phylum: 'Arthropoda',
    subphylumOrClass: 'Malacostraca',
    lineage: ['Animalia', 'Arthropoda', 'Malacostraca', 'Decapoda'],
    exampleSpecies: ['Homarus gammarus', 'Munidopsis serricornis', 'Chionoecetes opilio'],
    habitatNote: 'Benthic crustaceans including deep-sea squat lobsters, crabs, and hydrothermal vent shrimp.',
    trainingCount: 8000,
  },
  {
    classId: 6,
    name: 'Bivalvia',
    rank: 'Class',
    phylum: 'Mollusca',
    subphylumOrClass: 'Bivalvia',
    lineage: ['Animalia', 'Mollusca', 'Bivalvia'],
    exampleSpecies: ['Bathymodiolus thermophilus', 'Mytilus edulis', 'Calyptogena magnifica'],
    habitatNote: 'Filter-feeding and chemosynthetic molluscs abundant in benthic sediments and cold seeps.',
    trainingCount: 6000,
  },
  {
    classId: 7,
    name: 'Gastropoda',
    rank: 'Class',
    phylum: 'Mollusca',
    subphylumOrClass: 'Gastropoda',
    lineage: ['Animalia', 'Mollusca', 'Gastropoda'],
    exampleSpecies: ['Chrysomallon squamiferum', 'Littorina littorea', 'Buccinum undatum'],
    habitatNote: 'Marine snails and abyssal vent gastropods detected via mitochondrial COI and 16S barcodes.',
    trainingCount: 6000,
  },
];

export function findTaxonByName(name: string): TaxonReference | undefined {
  const normalized = name.trim().toLowerCase();
  return TAXA_REFERENCE.find((t) => t.name.toLowerCase() === normalized);
}

// Mitochondrial cytb sequence (Paracottus knerii, Perciformes) from marine_diverse dataset
export const EXAMPLE_SINGLE_SEQUENCE =
  'ATCGCAAACAATGCACTAGTTGACCTTCCAGCCCCCTCAAATATTTCGGTATGATGAAAC' +
  'TTTGGCTCCCTCCTCGGTCTCTGCTTGATTATCCAAATCCTAACCGGGCTCTTCCTCGCC' +
  'ATACATTACACCTCTGACATCGCAACAGCCTTCTCATCAGTAGGCCATATTTGCCGAGAT' +
  'GTCAACTACGGGTGACTTATCCGTAACCTCCACGCTAACGGTGCTTCTTTCTTCTTCATT' +
  'TGCATCTATATGCACATCGGACGGGGCCTTTACTACGGCTCTTACCTTTATAAAGAAACT' +
  'TGAAACATTGGGGTCGTACTCCTACTCCTTGTAATAATAACCGCTTTCGTAGGGTACGTC' +
  'CTCCCCTGAGGTCAAATGTCATTCTGAGGGGCCACTGTCATCACAAATCTTCTTTCTGCA' +
  'GTTCCTTACATTGGCAACGCTCTGGTCCAGTGAATCTGAGGAGGCTTCTCAGTAGACAAC' +
  'GCCACCCTCACGCGATTCTTTGCCTTTCACTTCCTCTTCCCCTTCGTAATTGCAGGTGCA';

export const EXAMPLE_BATCH_FASTA = `>NCBI_PX093086_Perciformes
ATCGCAAACAATGCACTAGTTGACCTTCCAGCCCCCTCAAATATTTCGGTATGATGAAACTTTGGCTCCCTCCTCGGTCTCTGCTTGATTATCCAAATCCTAACCGGGCTCTTCCTCGCCATACATTACACCTCTGACATCGCAACAGCCTTCTCATCAGTAGGCCATATTTGCCGAGATGTCAACTACGGGTGACTTATCCGTAACCTCCACGCTAACGGTGCTTCTTTCTTCTTCATTTGCATCTATATGCACATCGGACGGGGCCTTTACTACGGCTCTTACCTTTATAAAGAAACT
>Sample_Gadiformes_COI_02
CCTGTATCTAGTATTTGGTGCCTGAGCTGGAATAGTAGGAACAGCCCTAAGCCTCCTCATTCGAGCAGAACTTAGCCAACCCGGGGCTCTTTTGGGTGACGACCAGATTTATAATGTAATCGTTACTGCACATGCTTTCGTAATAATTTTCTTTATAGTAATGCCAATTATGATCGGAGGCTTTGGAAACTGACTTGTACCCCTAATGATTGGTGCCCCCGATATAGCATTTCCCCGAATAAACAACATAAGCTTCTGACTCCTGCCCCCATCCTTCCTTCTCCTACTAGCTTCT
>Sample_Decapoda_COI_03
GGTCAACAAATCATAAAGATATTGGAACTTTATATTTTATTTTTGGAGCATGAGCAGGAATAGTAGGAACTTCTTTAAGTTTATTAATTCGAGCAGAATTAGGACAACCTGGATCCTTAATTGGAGATGATCAAATTTATAATGTTGTTGTAACTGCCCATGCATTTGTAATAATTTTCTTTATAGTTATACCAATCATAATTGGAGGATTTGGAAATTGATTAGTTCCACTAATATTAGGAGCTCCAGATATAGCTTTTCCTCGAATAAATAATATAAGATTTTGATTACTACCT`;
