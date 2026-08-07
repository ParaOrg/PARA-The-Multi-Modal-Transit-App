// Metro lines - SVG path data
export const LINES = [
  // Top left to Helen
  { id: 'line1', d: 'M 0 -170 L 50 -150 Q 130 150 150 130 L 200 80 Q 220 60 250 60 L 280 60' },
  // Helen to Louis
  { id: 'line2', d: 'M 280 60 Q 320 60 350 90 L 380 120 Q 400 140 420 140 L 480 130' },
  // Louis down through center to Wilson
  { id: 'line3', d: 'M 420 140 L 420 200 Q 420 250 480 300 L 520 340 Q 560 380 600 400 Q 640 420 640 480 L 640 560' },
  // Top - Elaine branch
  { id: 'line4', d: 'M 600 0 L 450 60 Q 450 150 560 150 '},
  // Elaine to Shiva
  { id: 'line5', d: 'M 570 150 Q 610 150 650 180 L 700 220 Q 730 250 730 280' },
  // Horizontal through center
  { id: 'line6', d: 'M 0 400 L 200 400 Q 280 400 350 400 L 500 400' },
  // Shiva down to ticket area
  { id: 'line8', d: 'M 730 280 Q 730 340 680 370 L 640 400' },
  // Top right - Old Therese
  { id: 'line9', d: 'M 900 0 L 900 60 Q 900 100 950 130 L 1020 180 Q 1060 210 1060 250 L 1060 300' },
  // Old Therese to New Therese
  { id: 'line10', d: 'M 1060 300 Q 1060 350 1030 380 L 980 430 Q 950 460 950 500 L 950 550' },
  // Far right exit
  { id: 'line11', d: 'M 1060 300 L 1200 300' },
  // New Therese continuing
  { id: 'line12', d: 'M 950 550 Q 950 600 1000 640 L 1100 720 Q 1150 760 1200 760' },
  // Left side - Tagorda
  { id: 'line13', d: 'M 0 300 L 0 350 Q 120 350 150 380 L 150 400' },
  // Mariano Station
  { id: 'line14', d: 'M -50 300 L -50 550 Q 70 580 70 620' },
  // Left bottom exit
  { id: 'line15', d: 'M 0 500 L 50 500 Q 90 500 120 530 L 187 620' },
  // Mariano to Camilo
  { id: 'line16', d: 'M 70 620 Q 70 660 110 680 L 200 730 Q 260 760 320 760 L 400 760' },
  // Bottom left corner
  { id: 'line17', d: 'M 0 700 L 150 700 Q 190 700 200 650 L 190 625 L 220 400'},
  // Camilo area
  { id: 'line18', d: 'M 380 550 Q 380 600 350 640 L 300 700 Q 270 740 270 800 M 380 800 ' },
  // Camilo to Wilson
  { id: 'line19', d: 'M 400 760 Q 480 760 540 720 L 600 680 Q 640 650 640 600 L 640 560' },
  // Wilson to Gotuato
  { id: 'line21', d: 'M 640 600 Q 640 650 600 680 L 780 740 Q 830 770 880 770' },
  // Gotuato continuing
  { id: 'line22', d: 'M 880 770 Q 930 770 970 740 L 1050 680 Q 1100 640 1150 640 L 1200 640' },
  // Right side horizontal
  { id: 'line23', d: 'M -300 400 L 1200 400' },
  // Gotuato to New Therese
  { id: 'line25', d: 'M 880 770 Q 930 650 950 550' },
  // {id: line}
  // Old Therese to horizontal line
  { id: 'line26', d: 'M 1060 300 Q 1000 300 900 400 ' },
  // New Therese to horizontal line
  { id: 'line27', d: 'M 950 550 Q 950 430 900 400 ' },
  // Mariano to Camilo (curved connection)
  { id: 'line28', d: 'M 187 620 Q 280 580 380 550' },
  // Camilo to ticket area
  { id: 'line29', d: 'M 380 550 Q 500 480 640 400' },
];

