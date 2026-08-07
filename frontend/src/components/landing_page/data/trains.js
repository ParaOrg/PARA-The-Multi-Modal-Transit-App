// Trains - { id, path, duration (seconds), delay (seconds) }
// Paths synchronized with lines.js
export const TRAINS = [
  {
    id: 'train1',
    path: 'M 0 -170 L 50 -150 Q 130 150 150 130 L 200 80 Q 220 60 250 60 L 280 60', // line1: Top left to Helen
    duration: 12,
    delay: 0
  },
  {
    id: 'train2',
    path: 'M 280 60 Q 320 60 350 90 L 380 120 Q 400 140 420 140 L 480 130', // line2: Helen to Louis
    duration: 10,
    delay: 2
  },
  {
    id: 'train3',
    path: 'M 420 140 L 420 200 Q 420 250 480 300 L 520 340 Q 560 380 600 400 Q 640 420 640 480 L 640 560', // line3: Louis down through center to Wilson
    duration: 14,
    delay: 4
  },
  {
    id: 'train4',
    path: 'M 600 0 L 450 60 Q 450 150 560 150', // line4: Top - Elaine branch
    duration: 11,
    delay: 1
  },
  {
    id: 'train5',
    path: 'M 570 150 Q 610 150 650 180 L 700 220 Q 730 250 730 280', // line5: Elaine to Shiva
    duration: 10,
    delay: 3
  },
  {
    id: 'train6',
    path: 'M 0 400 L 200 400 Q 280 400 350 400 L 500 400', // line6: Horizontal through center
    duration: 12,
    delay: 0
  },
  {
    id: 'train7',
    path: 'M 730 280 Q 730 340 680 370 L 640 400', // line8: Shiva down to ticket area
    duration: 8,
    delay: 5
  },
  {
    id: 'train8',
    path: 'M 900 0 L 900 60 Q 900 100 950 130 L 1020 180 Q 1060 210 1060 250 L 1060 300', // line9: Top right - Old Therese
    duration: 12,
    delay: 6
  },
  {
    id: 'train9',
    path: 'M 1060 300 Q 1060 350 1030 380 L 980 430 Q 950 460 950 500 L 950 550', // line10: Old Therese to New Therese
    duration: 10,
    delay: 2
  },
  {
    id: 'train10',
    path: 'M 950 550 Q 950 600 1000 640 L 1100 720 Q 1150 760 1200 760', // line12: New Therese continuing
    duration: 8,
    delay: 7
  },
  {
    id: 'train11',
    path: 'M 70 620 Q 70 660 110 680 L 200 730 Q 260 760 320 760 L 400 760', // line16: Mariano to Camilo
    duration: 11,
    delay: 1
  },
  {
    id: 'train12',
    path: 'M 400 760 Q 480 760 540 720 L 600 680 Q 640 650 640 600 L 640 560', // line19: Camilo to Wilson
    duration: 12,
    delay: 4
  },
  {
    id: 'train13',
    path: 'M 640 600 Q 640 650 600 680 L 780 740 Q 830 770 880 770', // line21: Wilson to Gotuato
    duration: 13,
    delay: 3
  },
  {
    id: 'train14',
    path: 'M 880 770 Q 930 770 970 740 L 1050 680 Q 1100 640 1150 640 L 1200 640', // line22: Gotuato continuing
    duration: 14,
    delay: 5
  },
  {
    id: 'train15',
    path: 'M -300 400 L 1200 400', // line23: Right side horizontal
    duration: 16,
    delay: 0
  },
  {
    id: 'train16',
    path: 'M 380 550 Q 500 480 640 400', // line27: Camilo to ticket area
    duration: 9,
    delay: 6
  },
];