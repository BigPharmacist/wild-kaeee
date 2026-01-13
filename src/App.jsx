import { useState, useEffect, useRef } from 'react'
import { supabase, supabaseUrl } from './lib/supabase'
import { House, Camera, Pill, CalendarDots, CalendarBlank, ChatCircle, GearSix, EnvelopeSimple, Printer } from '@phosphor-icons/react'
import EmailView from './components/EmailView'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { jsPDF } from 'jspdf'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


// SVG Icons as components for modern look
const Icons = {
  Sun: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20l3.5-3.5H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Photo: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Pill: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.187 3.187 0 01-4.508 0L5 14.5m14 0l-4.5 4.5m-5-4.5l4.5 4.5" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
  // Wetter-Icons
  Cloud: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  CloudSun: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 0V3m4.22 1.78l-.707.707m.707-.707l-.707.707M21 12h-1m1 0h-1m-1.78 4.22l-.707-.707" />
    </svg>
  ),
  CloudRain: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 19v2m4-2v2m4-2v2" />
    </svg>
  ),
  CloudSnow: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <circle cx="8" cy="20" r="1" fill="currentColor" />
      <circle cx="12" cy="21" r="1" fill="currentColor" />
      <circle cx="16" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  CloudFog: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M6 18h12" />
    </svg>
  ),
  CloudBolt: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 11l-2 4h3l-2 4" />
    </svg>
  ),
  Droplet: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.5c-3.5 0-6.5-2.5-6.5-6.5 0-4.5 6.5-11 6.5-11s6.5 6.5 6.5 11c0 4-3 6.5-6.5 6.5z" />
    </svg>
  ),
  SunLarge: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  FileText: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  PostHorn: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="66 400 1167 562" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
      <path d="M319 417.928C304.902 423.374 292.454 431.34 274.356 446.5C270.416 449.8 264.112 455.065 260.347 458.201C248.998 467.651 222.25 495.564 208.125 512.696C205.315 516.104 202 519.999 200.758 521.351C199.516 522.703 198.05 524.43 197.5 525.189C196.95 525.947 194.686 528.803 192.469 531.534C187.94 537.114 175.915 553.161 171.137 560C163.488 570.95 142 603.686 142 604.389C142 604.612 140.22 607.726 138.044 611.307C135.869 614.888 131.984 621.796 129.412 626.659C126.839 631.521 123.604 637.525 122.223 640C114.982 652.973 105.078 673.901 98.972 689.132C94.14 701.184 87.049 721.367 86.019 726C85.591 727.925 84.422 733.1 83.421 737.5C82.192 742.904 81.596 749.556 81.587 758C81.573 770.163 81.663 770.688 84.943 777.472C90.839 789.666 101.271 797.807 115 800.929C122.126 802.55 133.251 801.893 154 798.627C177.944 794.858 201.068 795.055 222 799.208C233.184 801.426 253.752 806.997 262 810.041C266.675 811.767 271.625 813.536 273 813.972C276.303 815.02 295.296 822.639 301 825.204C307.466 828.112 312.476 830.32 321 834.021C325.125 835.811 333 839.403 338.5 842.004C344 844.604 350.637 847.692 353.25 848.866C355.863 850.039 360.137 851.961 362.75 853.134C365.363 854.308 372.225 857.508 378 860.245C383.775 862.981 390.714 866.094 393.419 867.162C398.519 869.175 402.928 871.112 414 876.202C417.575 877.846 425.971 881.378 432.658 884.052C439.345 886.726 449.062 890.728 454.251 892.945C464.727 897.421 485.45 904.89 506 911.596C524.751 917.716 524.844 917.745 531 919.4C534.025 920.213 541.225 922.26 547 923.948C552.775 925.636 560.2 927.671 563.5 928.472C571.636 930.444 593.944 935.017 605.5 937.08C608.8 937.669 613.525 938.539 616 939.013C618.475 939.487 624.325 940.373 629 940.982C633.675 941.59 638.85 942.313 640.5 942.589C662.684 946.293 719.576 946.46 749.5 942.909C768.912 940.605 813.395 930.756 825.5 926.082C828.25 925.02 834.775 922.599 840 920.703C845.225 918.806 851.975 916.196 855 914.902C864.167 910.981 892.845 896.203 897.497 893.002C899.897 891.351 902.134 890 902.469 890C903.502 890 920.974 878.047 931.5 870.139C943.081 861.438 957.727 849.259 963.533 843.5C965.751 841.3 968.676 838.557 970.033 837.405C974.55 833.569 1001.946 804.666 1006.014 799.443C1006.846 798.375 1009.096 795.475 1011.014 793C1012.931 790.525 1014.767 788.275 1015.094 788C1015.79 787.415 1038.18 757.587 1042.868 751C1048.746 742.741 1069.448 711.441 1073.5 704.686C1080.778 692.552 1106.159 654.612 1111.421 648C1114.266 644.425 1119.145 638.28 1122.264 634.343C1128.854 626.028 1144.231 610.244 1151.615 604.215C1154.428 601.919 1159.828 598.172 1163.615 595.889C1167.402 593.607 1170.673 591.587 1170.885 591.401C1172.122 590.315 1154.735 568.956 1144.845 559.411C1134.558 549.483 1119.097 537.325 1111 532.799C1108.525 531.415 1104.7 529.253 1102.5 527.994C1095.06 523.736 1079.928 518.006 1079.534 519.297C1079.332 519.959 1078.904 524.419 1078.581 529.209C1078.259 533.999 1077.59 538.949 1077.095 540.209C1076.6 541.469 1075.469 545.743 1074.582 549.707C1072.338 559.732 1065.576 579.949 1060.937 590.5C1060.453 591.6 1057.985 597.45 1055.451 603.5C1049.774 617.055 1029.19 658.837 1023.895 667.553C1021.753 671.079 1020 674.228 1020 674.552C1020 674.875 1018.65 677.102 1017 679.5C1015.35 681.898 1014 684.141 1014 684.485C1014 685.174 990.105 721.198 989.116 722C988.158 722.778 982.716 730.003 979.175 735.2C974.567 741.963 954.152 766.102 944.946 775.672C928.388 792.886 906.454 811.374 890.5 821.564C887.2 823.672 881.575 827.287 878 829.596C870.682 834.324 848.353 845.76 840 849.059C825.127 854.932 809.501 860.222 798.75 863.023C796.688 863.56 793.313 864.447 791.25 864.993C762.994 872.475 717.485 874.156 685 868.916C664.459 865.603 643.498 859.956 618.976 851.13C608.172 847.241 582.328 834.698 573.061 828.845C553.828 816.699 540.284 807.47 538 804.954C537.725 804.651 535.925 803.322 534 802C532.075 800.678 530.275 799.336 530 799.019C529.725 798.701 525.45 795.013 520.5 790.824C509.448 781.47 491.875 764.199 482.5 753.476C456.966 724.273 431.798 685.306 417.603 653C416.032 649.425 413.678 644.124 412.373 641.22C411.068 638.317 410 635.306 410 634.529C410 633.753 409.55 632.84 409 632.5C408.45 632.16 408 631.229 408 630.43C408 629.632 407.173 627.071 406.163 624.739C402.401 616.056 401.02 611.58 395.143 589C388.571 563.754 384.017 533.392 383.97 514.5C383.937 501.621 381.442 468.281 380.077 462.5C376.816 448.684 373.209 440.195 367.051 431.839C362.119 425.148 355.027 419.937 347.101 417.182C341.906 415.376 324.406 415.841 319 417.928M329.702 461.75C329.46 466.563 328.957 471.85 328.584 473.5C327.029 480.373 322.494 495.966 321.023 499.5C320.565 500.6 318.721 505.325 316.924 510C305.951 538.553 290.473 568.687 270.366 600.645C259.314 618.211 226.349 664.153 219.741 671.199C216.47 674.686 211.251 680.926 209 684.041C206.268 687.82 198.92 695.822 183.5 711.805C162.402 733.674 139.479 750.45 124.248 755.171C119.389 756.676 119.323 757.7 123.912 760.381C126.327 761.791 129.266 762.308 135.332 762.39C152.964 762.627 175.901 751.642 204.5 729.265C213.037 722.585 237.09 698.289 246.837 686.5C257.562 673.528 256.389 675.014 265.011 663.488C294.216 624.446 316.327 586.734 332.722 548C333.537 546.075 334.585 543.6 335.052 542.5C339.739 531.44 346 503.463 346 493.576C346 487.337 344.185 475.555 342.388 470.127C339.953 462.774 333.473 453 331.032 453C330.542 453 329.944 456.938 329.702 461.75M704.5 461.987C676.22 465.335 655.402 470.436 635.861 478.804C613.232 488.496 594.667 498.811 581.323 509.107C577.57 512.002 572.718 515.75 570.54 517.435C557.925 527.199 536.361 550.801 525.939 566.251C522.673 571.093 520 575.222 520 575.425C520 575.629 518.194 578.768 515.987 582.401C513.78 586.034 510.63 591.93 508.987 595.503C507.344 599.076 504.713 604.813 503.14 608.25C497.694 620.153 493.858 633.395 489.598 655C487.01 668.124 485.704 688.534 486.228 707.663L486.73 725.97L492.615 732.729C517.03 760.768 546.096 786.107 574.107 803.77C579.777 807.346 581.576 807.306 578.171 803.682C576.977 802.411 576 801.045 576 800.647C576 800.249 573.396 796.003 570.214 791.212C565.247 783.732 561.454 776.378 555.407 762.5C553.213 757.465 548.25 741.798 547.17 736.5C546.61 733.75 545.555 728.575 544.826 725C543.017 716.133 543.021 677.658 544.831 669.5C545.563 666.2 546.576 661.587 547.081 659.25C551.05 640.893 554.857 630.204 563.073 614.348C578.299 584.969 602.746 559.015 632 541.176C646.682 532.223 669.842 522.961 686.185 519.508C690.208 518.658 695.975 517.408 699 516.731C707.903 514.738 749.241 515.117 761.191 517.301C783.123 521.31 805.714 529.851 824.113 541.091C835.18 547.852 837.798 549.721 848.263 558.331C878.593 583.285 901.846 620.588 909.558 656.659C912.808 671.861 913.929 681.64 913.965 695.091C914.016 714.751 912.192 728.288 907.241 745C901.134 765.61 892.798 782.755 881.242 798.474C878.422 802.31 876.302 805.636 876.532 805.865C876.761 806.095 879.323 804.506 882.225 802.334C885.126 800.163 890.168 796.386 893.429 793.943C915.533 777.38 938.735 753.563 959.618 726C972.118 709.501 971.198 712.059 971.068 694.146C970.897 670.576 968.661 655.175 961.829 630.5C957.767 615.829 946.473 591.319 936.027 574.5C920.547 549.579 892.585 520.522 868.5 504.33C826.357 475.998 783.147 462.397 732.5 461.522C720.95 461.322 708.35 461.531 704.5 461.987M1096.5 465.604C1092.59 466.589 1085.627 470.527 1082.805 473.348C1076.863 479.291 1074.001 487.894 1075.039 496.696C1075.928 504.237 1076.565 505.316 1079.769 504.704C1082.336 504.213 1093.895 506.023 1099.628 507.814C1110.4 511.178 1134.412 524.433 1138 528.996C1138.275 529.346 1140.525 531.012 1143 532.699C1150.076 537.522 1164.972 553.61 1171.709 563.705C1175.087 568.767 1179.123 576.3 1180.676 580.444L1183.5 587.978L1190.261 587.989C1198.7 588.003 1204.558 585.445 1209.844 579.439C1216.921 571.4 1218.121 559.633 1213.013 548.368C1210.245 542.265 1202.753 530.435 1197.682 524.162C1194.342 520.03 1174.967 500.812 1170.5 497.2C1155.639 485.182 1133.686 472.262 1120.958 468.044C1114.714 465.975 1100.611 464.568 1096.5 465.604"/>
    </svg>
  ),
}

// Unread Badge Komponente für Apo-Tabs
const UnreadBadge = ({ count }) => {
  if (!count || count === 0) return null
  return (
    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authView, setAuthView] = useState('login') // 'login' | 'forgot' | 'resetPassword'
  const [successMessage, setSuccessMessage] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [secondaryTab, setSecondaryTab] = useState(() => localStorage.getItem('nav_secondaryTab') || 'overview')
  const [activeView, setActiveView] = useState(() => localStorage.getItem('nav_activeView') || 'dashboard')
  const [settingsTab, setSettingsTab] = useState(() => localStorage.getItem('nav_settingsTab') || 'pharmacies')
  const [pharmacies, setPharmacies] = useState([])
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false)
  const [pharmaciesMessage, setPharmaciesMessage] = useState('')
  const [editingPharmacy, setEditingPharmacy] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    street: '',
    postalCode: '',
    city: '',
    phone: '',
    owner: '',
    ownerRole: '',
    website: '',
    email: '',
    fax: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState('')
  const [editingStaff, setEditingStaff] = useState(null)
  const [staffForm, setStaffForm] = useState({
    firstName: '',
    lastName: '',
    street: '',
    postalCode: '',
    city: '',
    mobile: '',
    email: '',
    role: '',
    pharmacyId: '',
    authUserId: '',
    isAdmin: false,
    avatarUrl: '',
    employedSince: '',
  })
  const [staffSaveLoading, setStaffSaveLoading] = useState(false)
  const [staffSaveMessage, setStaffSaveMessage] = useState('')
  const [staffInviteLoading, setStaffInviteLoading] = useState(false)
  const [staffInviteMessage, setStaffInviteMessage] = useState('')
  const [staffAvatarFile, setStaffAvatarFile] = useState(null)
  // Email Settings state
  const [emailAccounts, setEmailAccounts] = useState([])
  const [emailAccountsLoading, setEmailAccountsLoading] = useState(false)
  const [emailPermissions, setEmailPermissions] = useState([])
  const [currentUserEmailAccess, setCurrentUserEmailAccess] = useState(false)
  const [editingEmailAccount, setEditingEmailAccount] = useState(null)
  const [emailAccountForm, setEmailAccountForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [emailAccountSaving, setEmailAccountSaving] = useState(false)
  const [emailAccountMessage, setEmailAccountMessage] = useState('')
  const [selectedEmailAccount, setSelectedEmailAccount] = useState(null)
  // Contacts state
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsMessage, setContactsMessage] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    mobile: '',
    fax: '',
    website: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'DE',
    contactType: 'business',
    tags: [],
    notes: '',
    shared: true,
    businessCardUrl: '',
    businessCardUrlEnhanced: '',
    status: 'aktiv',
    predecessorId: null,
    transitionDate: null,
  })
  const [contactSaveLoading, setContactSaveLoading] = useState(false)
  const [contactSaveMessage, setContactSaveMessage] = useState('')
  const [contactCardFile, setContactCardFile] = useState(null)
  const [contactCardPreview, setContactCardPreview] = useState('')
  const [contactCardEnhancedFile, setContactCardEnhancedFile] = useState(null)
  const [contactCardEnhancedPreview, setContactCardEnhancedPreview] = useState('')
  const [contactCardRotation, setContactCardRotation] = useState(0)
  const [contactCardEnhancing, setContactCardEnhancing] = useState(false)
  const contactCardInputRef = useRef(null)
  const businessCardScanRef = useRef(null)
  const mobileNavTimerRef = useRef(null)
  const isInitialMount = useRef(true)
  const [businessCardScanning, setBusinessCardScanning] = useState(false)
  const [businessCardOcrResult, setBusinessCardOcrResult] = useState(null)
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null) // { type: 'email'|'phone'|'company', matches: [], ocrData: {} }
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactViewMode, setContactViewMode] = useState('cards') // 'cards' | 'list'
  const [selectedContact, setSelectedContact] = useState(null) // Für Detail-Ansicht
  const [selectedContactCardView, setSelectedContactCardView] = useState('enhanced') // 'enhanced' | 'original'
  const [staffAvatarPreview, setStaffAvatarPreview] = useState('')
  const [weatherLocation, setWeatherLocation] = useState('')
  const [weatherInput, setWeatherInput] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [latestPhoto, setLatestPhoto] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [allPhotos, setAllPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [businessCards, setBusinessCards] = useState([])
  const [businessCardsLoading, setBusinessCardsLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [photoSaving, setPhotoSaving] = useState(false)
  const photoImgRef = useRef(null)
  const signatureCanvasRef = useRef(null)
  const signatureCtxRef = useRef(null)
  const pznCameraInputRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [photoOcrData, setPhotoOcrData] = useState({})
  const [mistralApiKey, setMistralApiKey] = useState(null)
  const [googleApiKey, setGoogleApiKey] = useState(null)
  const [enhanceFile, setEnhanceFile] = useState(null)
  const [enhancePreview, setEnhancePreview] = useState('')
  const [enhanceResultPreview, setEnhanceResultPreview] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhanceMessage, setEnhanceMessage] = useState('')
  const [ocrProcessing, setOcrProcessing] = useState({})
  const [apoTab, setApoTab] = useState(() => localStorage.getItem('nav_apoTab') || 'amk')
  const [apoYear, setApoYear] = useState(() => new Date().getFullYear())
  const [apoSearch, setApoSearch] = useState('')
  const [amkMessages, setAmkMessages] = useState([])
  const [amkLoading, setAmkLoading] = useState(false)
  const [recallMessages, setRecallMessages] = useState([])
  const [recallLoading, setRecallLoading] = useState(false)
  const [lavAusgaben, setLavAusgaben] = useState([])
  const [lavLoading, setLavLoading] = useState(false)
  const [selectedApoMessage, setSelectedApoMessage] = useState(null)
  const [showDokumentationModal, setShowDokumentationModal] = useState(false)
  const [dokumentationBemerkung, setDokumentationBemerkung] = useState('')
  const [dokumentationSignature, setDokumentationSignature] = useState(null)
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false)
  const [dokumentationLoading, setDokumentationLoading] = useState(false)
  const [existingDokumentationen, setExistingDokumentationen] = useState([])
  const [savedPznFotos, setSavedPznFotos] = useState({})  // { pzn: foto_path } - aus DB geladen
  const [pznFotoUploading, setPznFotoUploading] = useState(false)
  const [activePzn, setActivePzn] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({ amk: 0, recall: 0, lav: 0 })
  const [readMessageIds, setReadMessageIds] = useState({ amk: new Set(), recall: new Set(), lav: new Set() })
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [selectedPlanDate, setSelectedPlanDate] = useState(() => {
    const today = new Date()
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })

  // Kalender-System State
  const [calendars, setCalendars] = useState([])
  const [calendarsLoading, setCalendarsLoading] = useState(false)
  const [calendarsError, setCalendarsError] = useState('')
  const [selectedCalendarId, setSelectedCalendarId] = useState(null)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [calendarViewMode, setCalendarViewMode] = useState('month')
  const [showWeekends, setShowWeekends] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
  })
  const [eventSaving, setEventSaving] = useState(false)
  const [eventError, setEventError] = useState('')
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    description: '',
    color: '#10b981',
  })
  const [calendarSaving, setCalendarSaving] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [calendarPermissions, setCalendarPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [dashboardEvents, setDashboardEvents] = useState([])
  const [dashboardEventsLoading, setDashboardEventsLoading] = useState(false)

  // GH-Rechnungen State
  const [rechnungen, setRechnungen] = useState([])
  const [rechnungenLoading, setRechnungenLoading] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState({})
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState(null)

  const theme = {
    bgApp: 'bg-[#F5F7FA]',
    bg: 'bg-[#F5F7FA]',
    surface: 'bg-white',
    panel: 'bg-white',
    bgHover: 'hover:bg-[#F5F7FA]',
    bgCard: 'bg-white',
    textPrimary: 'text-[#1F2937]',
    text: 'text-[#1F2937]',
    textSecondary: 'text-[#6B7280]',
    textMuted: 'text-[#9CA3AF]',
    border: 'border-[#E5E7EB]',
    navActive: 'bg-[#EEF4FD] text-[#1F2937] border border-[#D6E6FB]',
    navHover: 'hover:bg-[#F5F7FA] hover:text-[#1F2937]',
    accent: 'bg-[#4A90E2] hover:bg-[#6AA9F0]',
    accentText: 'text-[#4A90E2]',
    primary: 'text-[#4A90E2]',
    primaryBg: 'bg-[#4A90E2]',
    primaryHover: 'hover:bg-[#6AA9F0]',
    secondary: 'text-[#7B6CF6]',
    sidebarBg: 'bg-[#3c4255]',
    sidebarHover: 'hover:bg-[#4a5066]',
    sidebarActive: 'border-white bg-transparent',
    sidebarText: 'text-[#E5E7EB]',
    sidebarTextActive: 'text-[#E5E7EB]',
    secondarySidebarBg: 'bg-[#4f5469]',
    secondaryActive: 'border-l-4 border-[#4A90E2] bg-[#3c4255] text-[#E5E7EB]',
    input: 'bg-white border-[#E5E7EB] focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2]',
    inputPlaceholder: 'placeholder-[#9CA3AF]',
    cardShadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
    cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]',
    overlay: 'bg-[#1F2937]/30',
    danger: 'text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]',
  }

  const navItems = [
    { id: 'dashboard', icon: () => <House size={20} weight="regular" />, label: 'Dashboard' },
    { id: 'photos', icon: () => <Camera size={20} weight="regular" />, label: 'Fotos' },
    { id: 'apo', icon: () => <Pill size={20} weight="regular" />, label: 'Apo' },
    { id: 'plan', icon: () => <CalendarDots size={20} weight="regular" />, label: 'Plan' },
    { id: 'calendar', icon: () => <CalendarBlank size={20} weight="regular" />, label: 'Kalender' },
    { id: 'chat', icon: () => <ChatCircle size={20} weight="regular" />, label: 'Chat' },
    { id: 'post', icon: () => <Icons.PostHorn />, label: 'Post' },
    { id: 'settings', icon: () => <GearSix size={20} weight="regular" />, label: 'Einstellungen' },
  ]

  const secondaryNavMap = {
    dashboard: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'insights', label: 'Insights' },
      { id: 'reports', label: 'Reports' },
    ],
    photos: [
      { id: 'uploads', label: 'Uploads' },
      { id: 'library', label: 'Archiv' },
      { id: 'ocr', label: 'OCR' },
      { id: 'visitenkarten', label: 'Visitenkarten' },
    ],
    apo: [
      { id: 'amk', label: 'AMK' },
      { id: 'recall', label: 'Rückrufe' },
      { id: 'lav', label: 'LAV' },
    ],
    plan: [
      { id: 'timeline', label: 'Zeitplan' },
    ],
    calendar: [
      { id: 'calendars', label: 'Kalender' },
    ],
    chat: [
      { id: 'inbox', label: 'Inbox' },
      { id: 'team', label: 'Team' },
      { id: 'settings', label: 'Einstellungen' },
    ],
    post: [
      { id: 'email', label: 'Email' },
      { id: 'fax', label: 'Fax' },
    ],
    settings: [
      { id: 'pharmacies', label: 'Apotheken' },
      { id: 'staff', label: 'Kollegium' },
      { id: 'contacts', label: 'Kontakte' },
      { id: 'email', label: 'E-Mail' },
      { id: 'card-enhance', label: 'Karten-Test' },
    ],
  }

  useEffect(() => {
    // Beim ersten Mount den gespeicherten Wert behalten
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (activeView === 'settings' || activeView === 'apo') return
    const nextItems = secondaryNavMap[activeView] || []
    if (nextItems.length) {
      setSecondaryTab(nextItems[0].id)
    }
  }, [activeView])

  // Navigation in localStorage speichern
  useEffect(() => {
    localStorage.setItem('nav_activeView', activeView)
  }, [activeView])

  useEffect(() => {
    localStorage.setItem('nav_secondaryTab', secondaryTab)
  }, [secondaryTab])

  useEffect(() => {
    localStorage.setItem('nav_settingsTab', settingsTab)
  }, [settingsTab])

  useEffect(() => {
    localStorage.setItem('nav_apoTab', apoTab)
  }, [apoTab])

  // Mobile Nav: Nach 3 Sekunden automatisch schließen wenn primärer Punkt gewählt
  useEffect(() => {
    // Timer abbrechen wenn vorhanden
    if (mobileNavTimerRef.current) {
      clearTimeout(mobileNavTimerRef.current)
      mobileNavTimerRef.current = null
    }
    // Nur Timer starten wenn Menü offen ist
    if (mobileNavOpen) {
      mobileNavTimerRef.current = setTimeout(() => {
        setMobileNavOpen(false)
      }, 5000)
    }
    return () => {
      if (mobileNavTimerRef.current) {
        clearTimeout(mobileNavTimerRef.current)
      }
    }
  }, [activeView, mobileNavOpen])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const getActiveSecondaryId = () => {
    if (activeView === 'settings') return settingsTab
    if (activeView === 'apo') return apoTab
    return secondaryTab
  }

  const handleSecondarySelect = (itemId) => {
    if (activeView === 'settings') {
      setSettingsTab(itemId)
    } else if (activeView === 'apo') {
      setApoTab(itemId)
    } else {
      setSecondaryTab(itemId)
    }
  }

  const pharmacyLookup = Object.fromEntries(
    pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.name]),
  )
  const staffByAuthId = Object.fromEntries(
    staff
      .filter((member) => member.auth_user_id)
      .map((member) => [member.auth_user_id, member]),
  )

  // PDF-Download für AMK-Meldungen
  const downloadAmkPdf = async (msg) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Logo laden und einfügen
    try {
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      doc.addImage(base64, 'JPEG', margin, y, 60, 28)
      y += 38
    } catch (e) {
      y += 10
    }

    // Titel
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(msg.title || '', maxWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 5

    // Kategorie
    if (msg.category) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(msg.category, margin, y)
      y += 6
    }

    // Datum
    if (msg.date) {
      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(new Date(msg.date).toLocaleDateString('de-DE'), margin, y)
      y += 10
    }

    doc.setTextColor(0)

    // Institution
    if (msg.institution) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Institution:', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(msg.institution, margin + 25, y)
      y += 8
    }

    // Trennlinie
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Volltext (ohne doppelten Titel/Datum am Anfang)
    if (msg.full_text) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      // Entferne Titel und Datum am Anfang des Textes, falls vorhanden
      let cleanedText = msg.full_text
      if (msg.title && cleanedText.startsWith(msg.title)) {
        cleanedText = cleanedText.substring(msg.title.length).trim()
      }
      // Entferne Datumszeile am Anfang (Format: dd.mm.yyyy oder yyyy-mm-dd)
      cleanedText = cleanedText.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*\n?/, '').trim()
      cleanedText = cleanedText.replace(/^\d{4}-\d{2}-\d{2}\s*\n?/, '').trim()

      const textLines = doc.splitTextToSize(cleanedText, maxWidth)

      for (let i = 0; i < textLines.length; i++) {
        if (y > pageHeight - 40) {
          doc.addPage()
          y = 20
        }
        doc.text(textLines[i], margin, y)
        y += 5
      }
      y += 10
    }

    // Dokumentationen aus Datenbank laden
    const { data: dokumentationen } = await supabase
      .from('amk_dokumentationen')
      .select('*')
      .eq('amk_message_id', msg.id)
      .order('erstellt_am', { ascending: true })

    // Fußzeile mit Dokumentation
    if (y > pageHeight - 80) {
      doc.addPage()
      y = 20
    }

    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Gespeicherte Dokumentationen anzeigen
    if (dokumentationen && dokumentationen.length > 0) {
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.text('Dokumentation:', margin, y)
      y += 12

      for (const dok of dokumentationen) {
        // Berechne Box-Höhe
        let boxHeight = 16 // Padding oben/unten
        const boxPadding = 8
        const innerWidth = maxWidth - boxPadding * 2

        let bemerkungLines = []
        if (dok.bemerkung) {
          doc.setFontSize(14)
          bemerkungLines = doc.splitTextToSize(dok.bemerkung, innerWidth)
          boxHeight += bemerkungLines.length * 7
        }
        if (dok.unterschrift_data) {
          boxHeight += 38 // Größere Unterschrift (75x30) + Abstand
        }
        boxHeight += 14 // Name/Datum

        // Seitenumbruch prüfen
        if (y + boxHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        // Box mit runden Ecken zeichnen
        doc.setFillColor(245, 247, 250)
        doc.setDrawColor(200)
        doc.roundedRect(margin, y, maxWidth, boxHeight, 4, 4, 'FD')

        let boxY = y + boxPadding

        // Bemerkung
        if (dok.bemerkung && bemerkungLines.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(14)
          doc.setTextColor(0)
          for (const line of bemerkungLines) {
            doc.text(line, margin + boxPadding, boxY + 4)
            boxY += 7
          }
          boxY += 4
        }

        // Unterschrift als Bild (50% größer: 75x30)
        if (dok.unterschrift_data) {
          try {
            doc.addImage(dok.unterschrift_data, 'PNG', margin + boxPadding, boxY, 75, 30)
            boxY += 34
          } catch (e) {
            // Fehler beim Laden der Unterschrift ignorieren
          }
        }

        // Name und Datum
        doc.setFontSize(12)
        doc.setTextColor(100)
        const nameAndDate = [
          dok.erstellt_von_name || '',
          dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''
        ].filter(Boolean).join(' · ')
        if (nameAndDate) {
          doc.text(nameAndDate, margin + boxPadding, boxY + 4)
        }
        doc.setTextColor(0)

        y += boxHeight + 8
      }
    } else {
      // Leere Unterschriftsfelder nur wenn keine Dokumentation vorhanden
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Bearbeitet durch:', margin, y)
      doc.line(margin + 35, y, margin + 100, y)
      y += 8
      doc.text('Bearbeitet am:', margin, y)
      doc.line(margin + 35, y, margin + 100, y)
      y += 12

      doc.setFont('helvetica', 'bold')
      doc.text('Zur Kenntnis genommen:', margin, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      for (let i = 0; i < 5; i++) {
        doc.text('Name / Datum:', margin, y)
        doc.line(margin + 30, y, margin + 100, y)
        y += 8
      }
    }

    // Download
    const filename = `AMK_${msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
    doc.save(filename)
  }

  // PDF-Download für Rückrufe
  const downloadRecallPdf = async (msg) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Logo laden und einfügen (AMK-Logo)
    try {
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      doc.addImage(base64, 'JPEG', margin, y, 60, 28)
      y += 38
    } catch (e) {
      y += 10
    }

    // Rückruf-Badge
    doc.setFillColor(239, 68, 68)
    doc.roundedRect(margin, y, 30, 8, 2, 2, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255)
    doc.setFont('helvetica', 'bold')
    doc.text('RÜCKRUF', margin + 3, y + 5.5)
    y += 14

    doc.setTextColor(0)

    // Titel
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(msg.title || '', maxWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 7 + 5

    // Produktname
    if (msg.product_name) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38)
      doc.text(msg.product_name, margin, y)
      y += 8
    }

    doc.setTextColor(0)

    // Rückrufnummer und Datum in einer Zeile
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    let infoLine = ''
    if (msg.recall_number) infoLine += `Rückrufnummer: ${msg.recall_number}`
    if (msg.date) {
      if (infoLine) infoLine += '  |  '
      infoLine += new Date(msg.date).toLocaleDateString('de-DE')
    }
    if (infoLine) {
      doc.text(infoLine, margin, y)
      y += 8
    }

    doc.setTextColor(0)

    // Trennlinie
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // KI-Zusammenfassung (falls vorhanden)
    if (msg.ai_zusammenfassung) {
      doc.setFillColor(240, 249, 255)
      const summaryLines = doc.splitTextToSize(msg.ai_zusammenfassung.replace(/[*#]/g, ''), maxWidth - 10)
      const boxHeight = summaryLines.length * 5 + 12
      doc.roundedRect(margin, y, maxWidth, boxHeight, 3, 3, 'F')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text('KI-Zusammenfassung:', margin + 5, y + 6)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
      doc.setFontSize(9)
      doc.text(summaryLines, margin + 5, y + 12)
      y += boxHeight + 8
    }

    // Chargen-Info
    if (msg.ai_chargen_alle !== null || (msg.ai_chargen_liste && msg.ai_chargen_liste.length > 0)) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Betroffene Chargen:', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')

      if (msg.ai_chargen_alle) {
        doc.setTextColor(220, 38, 38)
        doc.text('ALLE CHARGEN BETROFFEN', margin, y)
        doc.setTextColor(0)
        y += 6
      } else if (msg.ai_chargen_liste && msg.ai_chargen_liste.length > 0) {
        const chargenText = msg.ai_chargen_liste.join(', ')
        const chargenLines = doc.splitTextToSize(chargenText, maxWidth)
        doc.text(chargenLines, margin, y)
        y += chargenLines.length * 5 + 2
      }
      y += 4
    }

    // PZN-Info
    if (msg.ai_pzn_betroffen && msg.ai_pzn_betroffen.length > 0) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Betroffene PZN:', margin, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      const pznText = msg.ai_pzn_betroffen.join(', ')
      const pznLines = doc.splitTextToSize(pznText, maxWidth)
      doc.text(pznLines, margin, y)
      y += pznLines.length * 5 + 6
    }

    // Trennlinie vor Volltext
    if (msg.full_text) {
      doc.setDrawColor(200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8
    }

    // Volltext
    if (msg.full_text) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      let cleanedText = msg.full_text
      if (msg.title && cleanedText.startsWith(msg.title)) {
        cleanedText = cleanedText.substring(msg.title.length).trim()
      }
      cleanedText = cleanedText.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*\n?/, '').trim()
      cleanedText = cleanedText.replace(/^\d{4}-\d{2}-\d{2}\s*\n?/, '').trim()

      const textLines = doc.splitTextToSize(cleanedText, maxWidth)

      for (let i = 0; i < textLines.length; i++) {
        if (y > pageHeight - 40) {
          doc.addPage()
          y = 20
        }
        doc.text(textLines[i], margin, y)
        y += 5
      }
      y += 10
    }

    // Dokumentationen aus Datenbank laden
    const { data: dokumentationen } = await supabase
      .from('recall_dokumentationen')
      .select('*')
      .eq('recall_message_id', msg.id)
      .order('erstellt_am', { ascending: true })

    // Fußzeile mit Dokumentation
    if (y > pageHeight - 80) {
      doc.addPage()
      y = 20
    }

    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Gespeicherte Dokumentationen anzeigen
    if (dokumentationen && dokumentationen.length > 0) {
      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.text('Dokumentation:', margin, y)
      y += 12

      for (const dok of dokumentationen) {
        // Berechne Box-Höhe
        let boxHeight = 16 // Padding oben/unten
        const boxPadding = 8
        const innerWidth = maxWidth - boxPadding * 2

        let bemerkungLines = []
        if (dok.bemerkung) {
          doc.setFontSize(14)
          bemerkungLines = doc.splitTextToSize(dok.bemerkung, innerWidth)
          boxHeight += bemerkungLines.length * 7
        }
        if (dok.unterschrift_data) {
          boxHeight += 38 // Größere Unterschrift (75x30) + Abstand
        }
        // Platz für PZN-Fotos
        if (dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0) {
          boxHeight += 65 // Foto (60x45) + Label + Abstand
        }
        boxHeight += 14 // Name/Datum

        // Seitenumbruch prüfen
        if (y + boxHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        // Box mit runden Ecken zeichnen
        doc.setFillColor(245, 247, 250)
        doc.setDrawColor(200)
        doc.roundedRect(margin, y, maxWidth, boxHeight, 4, 4, 'FD')

        let boxY = y + boxPadding

        // Bemerkung
        if (dok.bemerkung && bemerkungLines.length > 0) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(14)
          doc.setTextColor(0)
          for (const line of bemerkungLines) {
            doc.text(line, margin + boxPadding, boxY + 4)
            boxY += 7
          }
          boxY += 4
        }

        // Unterschrift als Bild (50% größer: 75x30)
        if (dok.unterschrift_data) {
          try {
            doc.addImage(dok.unterschrift_data, 'PNG', margin + boxPadding, boxY, 75, 30)
            boxY += 34
          } catch (e) {
            // Fehler beim Laden der Unterschrift ignorieren
          }
        }

        // PZN-Fotos anzeigen
        if (dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0)
          doc.text('PZN-Fotos:', margin + boxPadding, boxY + 4)
          boxY += 8

          let photoX = margin + boxPadding
          for (const [pzn, path] of Object.entries(dok.pzn_fotos)) {
            try {
              const photoUrl = `${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`
              const photoResponse = await fetch(photoUrl)
              const photoBlob = await photoResponse.blob()
              const photoBase64 = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(photoBlob)
              })

              // Foto einfügen (60x45 - 50% größer)
              doc.addImage(photoBase64, 'JPEG', photoX, boxY, 60, 45)

              // PZN-Label unter dem Foto
              doc.setFontSize(8)
              doc.setFont('helvetica', 'normal')
              doc.text(pzn, photoX + 30, boxY + 50, { align: 'center' })

              photoX += 65
            } catch (e) {
              // Fehler beim Laden des Fotos ignorieren
            }
          }
          boxY += 55
        }

        // Name und Datum
        doc.setFontSize(12)
        doc.setTextColor(100)
        const nameAndDate = [
          dok.erstellt_von_name || '',
          dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''
        ].filter(Boolean).join(' · ')
        if (nameAndDate) {
          doc.text(nameAndDate, margin + boxPadding, boxY + 4)
        }
        doc.setTextColor(0)

        y += boxHeight + 8
      }
    } else {
      // Leere Unterschriftsfelder nur wenn keine Dokumentation vorhanden
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Bearbeitet durch:', margin, y)
      doc.line(margin + 35, y, margin + 100, y)
      y += 8
      doc.text('Bearbeitet am:', margin, y)
      doc.line(margin + 35, y, margin + 100, y)
      y += 12

      doc.setFont('helvetica', 'bold')
      doc.text('Zur Kenntnis genommen:', margin, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      for (let i = 0; i < 5; i++) {
        doc.text('Name / Datum:', margin, y)
        doc.line(margin + 30, y, margin + 100, y)
        y += 8
      }
    }

    // Download
    const filename = `Rueckruf_${msg.product_name?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
    doc.save(filename)
  }

  const fetchPharmacies = async () => {
    setPharmaciesLoading(true)
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, name, street, postal_code, city, phone, owner, owner_role, website, email, fax')
      .order('name', { ascending: true })

    if (error) {
      setPharmaciesMessage(error.message)
      setPharmacies([])
    } else {
      setPharmaciesMessage('')
      setPharmacies(data || [])
    }
    setPharmaciesLoading(false)
  }

  const fetchStaff = async () => {
    setStaffLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name, street, postal_code, city, mobile, email, role, pharmacy_id, auth_user_id, is_admin, avatar_url, created_at')
      .order('last_name', { ascending: true })

    if (error) {
      setStaffMessage(error.message)
      setStaff([])
    } else {
      setStaffMessage('')
      setStaff(data || [])
      if (session?.user?.id) {
        const matched = (data || []).find((member) => member.auth_user_id === session.user.id)
        setCurrentStaff(matched || null)
      }
    }
    setStaffLoading(false)
  }

  // Email Account functions (Supabase)
  const fetchEmailAccounts = async () => {
    if (!session?.user?.id) return
    setEmailAccountsLoading(true)
    const { data, error } = await supabase
      .from('email_accounts')
      .select('id, name, email, password')
      .order('name', { ascending: true })

    if (error) {
      console.error('Fehler beim Laden der E-Mail-Accounts:', error.message)
      setEmailAccounts([])
    } else {
      setEmailAccounts(data || [])
      // Wenn Accounts vorhanden und keiner ausgewählt, ersten auswählen
      if (data?.length > 0 && !selectedEmailAccount) {
        setSelectedEmailAccount(data[0].id)
      }
    }
    setEmailAccountsLoading(false)
  }

  const openEmailAccountModal = (account = null) => {
    if (account) {
      setEditingEmailAccount(account.id)
      setEmailAccountForm({
        name: account.name || '',
        email: account.email || '',
        password: account.password || '',
      })
    } else {
      setEditingEmailAccount('new')
      setEmailAccountForm({
        name: '',
        email: '',
        password: '',
      })
    }
    setEmailAccountMessage('')
  }

  const closeEmailAccountModal = () => {
    setEditingEmailAccount(null)
    setEmailAccountForm({ name: '', email: '', password: '' })
    setEmailAccountMessage('')
  }

  const handleSaveEmailAccount = async () => {
    if (!emailAccountForm.email || !emailAccountForm.password) {
      setEmailAccountMessage('E-Mail und Passwort sind erforderlich')
      return
    }

    setEmailAccountSaving(true)
    setEmailAccountMessage('')

    // Test der Verbindung über Proxy
    const jmapBaseUrl = import.meta.env.VITE_JMAP_URL || ''
    try {
      const credentials = btoa(`${emailAccountForm.email}:${emailAccountForm.password}`)
      const response = await fetch(`${jmapBaseUrl}/jmap/session`, {
        headers: { 'Authorization': `Basic ${credentials}` }
      })

      if (!response.ok) {
        throw new Error('Authentifizierung fehlgeschlagen - bitte Zugangsdaten prüfen')
      }

      // Verbindung erfolgreich - Account in Supabase speichern (global für alle)
      const accountData = {
        name: emailAccountForm.name || emailAccountForm.email.split('@')[0],
        email: emailAccountForm.email,
        password: emailAccountForm.password,
      }

      let savedAccount
      if (editingEmailAccount === 'new') {
        const { data, error } = await supabase
          .from('email_accounts')
          .insert(accountData)
          .select()
          .single()
        if (error) throw new Error(error.message)
        savedAccount = data
      } else {
        const { data, error } = await supabase
          .from('email_accounts')
          .update(accountData)
          .eq('id', editingEmailAccount)
          .select()
          .single()
        if (error) throw new Error(error.message)
        savedAccount = data
      }

      // Accounts neu laden
      await fetchEmailAccounts()

      // Wenn erster Account oder keiner ausgewählt, diesen auswählen
      if (emailAccounts.length === 0 || !selectedEmailAccount) {
        setSelectedEmailAccount(savedAccount.id)
      }

      closeEmailAccountModal()
    } catch (err) {
      setEmailAccountMessage(err.message || 'Verbindung fehlgeschlagen')
    } finally {
      setEmailAccountSaving(false)
    }
  }

  const handleDeleteEmailAccount = async (accountId) => {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Fehler beim Löschen:', error.message)
      return
    }

    // Accounts neu laden
    await fetchEmailAccounts()

    if (selectedEmailAccount === accountId) {
      const remaining = emailAccounts.filter(a => a.id !== accountId)
      setSelectedEmailAccount(remaining[0]?.id || null)
    }
  }

  const handleSelectEmailAccount = (accountId) => {
    setSelectedEmailAccount(accountId)
  }

  // Email Permissions functions (Admin only)
  const fetchEmailPermissions = async () => {
    const { data, error } = await supabase
      .from('email_permissions')
      .select('*')

    if (!error && data) {
      setEmailPermissions(data)
      // Prüfen ob aktueller Nutzer Zugriff hat
      const currentUserPermission = data.find(p => p.user_id === session?.user?.id)
      setCurrentUserEmailAccess(currentUserPermission?.has_access || false)
    }
  }

  const toggleEmailPermission = async (userId, currentAccess) => {
    // Prüfen ob Permission bereits existiert
    const existing = emailPermissions.find(p => p.user_id === userId)

    if (existing) {
      // Update
      const { error } = await supabase
        .from('email_permissions')
        .update({ has_access: !currentAccess, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      if (!error) {
        await fetchEmailPermissions()
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('email_permissions')
        .insert({ user_id: userId, has_access: true })

      if (!error) {
        await fetchEmailPermissions()
      }
    }
  }

  // Contacts functions
  const fetchContacts = async () => {
    setContactsLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('company', { ascending: true })
      .order('last_name', { ascending: true })

    if (error) {
      setContactsMessage(error.message)
      setContacts([])
    } else {
      setContactsMessage('')
      setContacts(data || [])
    }
    setContactsLoading(false)
  }

  // GH-Rechnungen laden
  const fetchRechnungen = async () => {
    setRechnungenLoading(true)
    const { data, error } = await supabase
      .from('rechnungen')
      .select('*')
      .order('datum', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Fehler beim Laden der Rechnungen:', error.message)
      setRechnungen([])
    } else {
      setRechnungen(data || [])
    }
    setRechnungenLoading(false)
  }

  // PDF im Modal öffnen
  const openPdfModal = async (rechnung) => {
    // Signierte URL für das PDF holen
    const { data, error } = await supabase.storage
      .from('rechnungen')
      .createSignedUrl(rechnung.storage_path, 3600) // 1 Stunde gültig

    if (error) {
      console.error('Fehler beim Erstellen der PDF-URL:', error.message)
      return
    }

    setSelectedPdf({
      ...rechnung,
      url: data.signedUrl
    })
    setPdfModalOpen(true)
  }

  const closePdfModal = () => {
    setPdfModalOpen(false)
    setSelectedPdf(null)
  }

  const openContactModal = (contact = null) => {
    setEditingContact(contact || { id: null })
    setContactSaveMessage('')
    setContactForm({
      firstName: contact?.first_name || '',
      lastName: contact?.last_name || '',
      company: contact?.company || '',
      position: contact?.position || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      fax: contact?.fax || '',
      website: contact?.website || '',
      street: contact?.street || '',
      postalCode: contact?.postal_code || '',
      city: contact?.city || '',
      country: contact?.country || 'DE',
      contactType: contact?.contact_type || 'business',
      tags: contact?.tags || [],
      notes: contact?.notes || '',
      shared: contact?.shared ?? true,
      businessCardUrl: contact?.business_card_url || '',
      businessCardUrlEnhanced: contact?.business_card_url_enhanced || '',
    })
    setContactCardFile(null)
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview(contact?.business_card_url_enhanced || '')
    setContactCardPreview(contact?.business_card_url_enhanced || contact?.business_card_url || '')
    setContactCardEnhancing(false)
    setContactCardRotation(0)
  }

  const closeContactModal = () => {
    setEditingContact(null)
    setContactSaveMessage('')
    setContactCardFile(null)
    setContactCardPreview('')
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview('')
    setContactCardEnhancing(false)
    setContactCardRotation(0)
  }

  const handleContactInput = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }

  // EXIF-Orientation aus JPEG auslesen (1-8)
  const getExifOrientation = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const view = new DataView(e.target.result)
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1) // Kein JPEG
          return
        }
        let offset = 2
        while (offset < view.byteLength) {
          const marker = view.getUint16(offset, false)
          offset += 2
          if (marker === 0xFFE1) { // APP1 (EXIF)
            if (view.getUint32(offset + 2, false) !== 0x45786966) { // "Exif"
              resolve(1)
              return
            }
            const little = view.getUint16(offset + 8, false) === 0x4949
            const tags = view.getUint16(offset + 16, little)
            for (let i = 0; i < tags; i++) {
              const tagOffset = offset + 18 + i * 12
              if (view.getUint16(tagOffset, little) === 0x0112) { // Orientation tag
                resolve(view.getUint16(tagOffset + 8, little))
                return
              }
            }
            resolve(1)
            return
          } else if ((marker & 0xFF00) !== 0xFF00) {
            break
          } else {
            offset += view.getUint16(offset, false)
          }
        }
        resolve(1)
      }
      reader.readAsArrayBuffer(file.slice(0, 65536))
    })
  }

  // Bild automatisch drehen basierend auf EXIF-Orientation
  const autoRotateImage = async (file) => {
    const orientation = await getExifOrientation(file)
    if (orientation === 1) return file // Keine Drehung nötig

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Canvas-Größe basierend auf Orientation
          if (orientation >= 5 && orientation <= 8) {
            canvas.width = img.height
            canvas.height = img.width
          } else {
            canvas.width = img.width
            canvas.height = img.height
          }

          // Transformation basierend auf Orientation
          switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break // Horizontal flip
            case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break // 180°
            case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break // Vertical flip
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break // 90° CW + flip
            case 6: ctx.transform(0, 1, -1, 0, canvas.width, 0); break // 90° CW
            case 7: ctx.transform(0, -1, -1, 0, canvas.width, canvas.height); break // 90° CCW + flip
            case 8: ctx.transform(0, -1, 1, 0, 0, canvas.height); break // 90° CCW
            default: break
          }

          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.95)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // KI-basierte Rotationserkennung für Visitenkarten
  const detectRotationWithAI = async (file, apiKey) => {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analysiere dieses Bild einer Visitenkarte. Um wie viel Grad im Uhrzeigersinn muss es gedreht werden, damit der Text richtig lesbar ist (horizontal, von links nach rechts)? Antworte NUR mit einer Zahl: 0, 90, 180 oder 270'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }
          ]
        }],
        max_tokens: 10,
      }),
    })

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || '0'
    const match = content.match(/\b(0|90|180|270)\b/)
    return match ? parseInt(match[1], 10) : 0
  }

  // Bild um bestimmten Winkel drehen
  const rotateImageByDegrees = (file, degrees) => {
    if (degrees === 0) return Promise.resolve(file)

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (degrees === 90 || degrees === 270) {
            canvas.width = img.height
            canvas.height = img.width
          } else {
            canvas.width = img.width
            canvas.height = img.height
          }

          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((degrees * Math.PI) / 180)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.95)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Bild komprimieren (max 800px Breite, 70% Qualität)
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', quality)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const rotateImage = (file, degrees) => {
    return new Promise((resolve) => {
      if (degrees === 0) {
        resolve(file)
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const isRotated90or270 = degrees === 90 || degrees === 270
          canvas.width = isRotated90or270 ? img.height : img.width
          canvas.height = isRotated90or270 ? img.width : img.height
          const ctx = canvas.getContext('2d')
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((degrees * Math.PI) / 180)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.9)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleContactCardChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setContactCardFile(file)
    setContactCardPreview(URL.createObjectURL(file))
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview('')
    setContactCardEnhancing(false)
    setContactCardRotation(0)
  }

  const handleEnhanceFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setEnhanceFile(file)
    setEnhancePreview(URL.createObjectURL(file))
    setEnhanceResultPreview('')
    setEnhanceMessage('')
  }

  const getEnhancedImage = async (file, apiKey) => {
    // Bild als Base64 konvertieren
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })

    // Google Nano Banana Pro API aufrufen
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: file.type || 'image/jpeg',
                  data: base64
                }
              },
              {
                text: `Enhance this business card photo:
1. Crop tightly to the card edges
2. Correct perspective distortion (make edges straight and rectangular)
3. Improve sharpness and readability
4. Keep all text, logos, and colors exactly as they are
5. Output as a clean, professional-looking scan`
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          }
        })
      }
    )

    const result = await response.json()
    console.log('Nano Banana Pro Response:', response.status, result)

    if (!response.ok) {
      throw new Error(result?.error?.message || 'Google Nano Banana Pro Anfrage fehlgeschlagen.')
    }

    // Bild aus Response extrahieren
    const parts = result?.candidates?.[0]?.content?.parts || []
    console.log('Nano Banana Pro Parts:', parts.map(p => ({ hasImage: !!p.inlineData, hasText: !!p.text })))
    const imagePart = parts.find(p => p.inlineData?.data)

    if (!imagePart) {
      throw new Error('Kein Bild von Nano Banana Pro erhalten. Parts: ' + JSON.stringify(parts.map(p => Object.keys(p))))
    }

    // Base64 zu Blob konvertieren
    const byteString = atob(imagePart.inlineData.data)
    const byteArray = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i += 1) {
      byteArray[i] = byteString.charCodeAt(i)
    }
    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    const blob = new Blob([byteArray], { type: mimeType })

    const previewUrl = URL.createObjectURL(blob)
    const enhancedFile = new File([blob], 'business-card-enhanced.png', {
      type: mimeType,
    })
    return { previewUrl, enhancedFile }
  }

  const runBusinessCardEnhance = async () => {
    if (!enhanceFile) {
      setEnhanceMessage('Bitte zuerst ein Foto auswählen.')
      return
    }

    let apiKey = googleApiKey
    if (!apiKey) {
      apiKey = await fetchGoogleApiKey()
    }
    if (!apiKey) {
      setEnhanceMessage('Google API Key nicht gefunden (erwartet: name = "Google Nano Banana").')
      return
    }

    setEnhanceLoading(true)
    setEnhanceMessage('')
    setEnhanceResultPreview('')

    try {
      const { previewUrl } = await getEnhancedImage(enhanceFile, apiKey)
      setEnhanceResultPreview(previewUrl)
    } catch (error) {
      setEnhanceMessage(error.message || 'Verbesserung fehlgeschlagen.')
    } finally {
      setEnhanceLoading(false)
    }
  }

  // Duplikat-Prüfung für Kontakte
  const checkContactDuplicates = async (ocrData) => {
    const checks = []

    // 1. Prüfe E-Mail
    if (ocrData.email?.trim()) {
      const { data: emailMatches } = await supabase
        .from('contacts')
        .select('*')
        .ilike('email', ocrData.email.trim())
        .eq('status', 'aktiv')
      if (emailMatches?.length > 0) {
        checks.push({ type: 'email', matches: emailMatches, field: ocrData.email })
      }
    }

    // 2. Prüfe Telefon/Mobil
    const phoneToCheck = ocrData.phone?.trim() || ocrData.mobile?.trim()
    if (phoneToCheck) {
      const normalizedPhone = phoneToCheck.replace(/[\s\-\/]/g, '')
      const { data: phoneMatches } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'aktiv')
        .or(`phone.ilike.%${normalizedPhone}%,mobile.ilike.%${normalizedPhone}%`)
      if (phoneMatches?.length > 0) {
        checks.push({ type: 'phone', matches: phoneMatches, field: phoneToCheck })
      }
    }

    // 3. Prüfe Firma (für Vertreterwechsel)
    if (ocrData.company?.trim()) {
      const { data: companyMatches } = await supabase
        .from('contacts')
        .select('*')
        .ilike('company', ocrData.company.trim())
        .eq('status', 'aktiv')

      // Nur wenn andere Person bei gleicher Firma
      const differentPerson = companyMatches?.filter((c) =>
        c.first_name?.toLowerCase() !== ocrData.firstName?.toLowerCase() ||
        c.last_name?.toLowerCase() !== ocrData.lastName?.toLowerCase()
      )
      if (differentPerson?.length > 0) {
        checks.push({ type: 'company', matches: differentPerson, field: ocrData.company })
      }
    }

    return checks
  }

  // Visitenkarte scannen und OCR durchführen
  const handleBusinessCardScan = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBusinessCardScanning(true)
    setBusinessCardOcrResult(null)
    setDuplicateCheckResult(null)
    setContactSaveMessage('')

    try {
      // API Keys holen
      let apiKey = mistralApiKey
      if (!apiKey) {
        apiKey = await fetchMistralApiKey()
      }
      if (!apiKey) {
        throw new Error('Mistral API Key nicht gefunden')
      }

      // 1. KI-basierte Rotationserkennung (ohne EXIF)
      const aiRotation = await detectRotationWithAI(file, apiKey)
      const rotatedFile = await rotateImageByDegrees(file, aiRotation)

      // 2. Google Nano Banana Pro Enhancement parallel starten mit unkomprimiertem Bild
      let googleKey = googleApiKey
      if (!googleKey) {
        googleKey = await fetchGoogleApiKey()
      }
      if (!googleKey) {
        console.warn('Google Nano Banana API Key nicht gefunden - KI-Verbesserung übersprungen')
      }
      if (googleKey) {
        setContactCardEnhancing(true)
        getEnhancedImage(rotatedFile, googleKey)
          .then(({ previewUrl, enhancedFile }) => {
            setContactCardEnhancedFile(enhancedFile)
            setContactCardEnhancedPreview(previewUrl)
            setContactCardPreview(previewUrl)
          })
          .catch((error) => {
            console.warn('Nano Banana Pro Enhance fehlgeschlagen:', error)
          })
          .finally(() => {
            setContactCardEnhancing(false)
          })
      }

      // 3. Komprimieren für Speicherung und Preview
      const compressedFile = await compressImage(rotatedFile, 1200, 0.8)
      setContactCardFile(compressedFile)
      // NICHT setContactCardEnhancedFile(null) - das würde das KI-Ergebnis überschreiben!
      setContactCardPreview(URL.createObjectURL(compressedFile))
      setContactCardRotation(0)

      // 4. Bild als Base64 für OCR (rotiertes Bild)
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(rotatedFile)
      })

      // 5. OCR mit mistral-ocr-latest über /v1/ocr Endpunkt
      const ocrResponse = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: `data:image/jpeg;base64,${base64}`
          }
        }),
      })

      const ocrResult = await ocrResponse.json()
      const ocrText = ocrResult.pages?.[0]?.markdown || ''

      if (!ocrText) {
        throw new Error('OCR hat keinen Text erkannt')
      }

      // 6. OCR-Text mit Pixtral in strukturiertes JSON umwandeln
      const structureResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{
            role: 'user',
            content: `Extrahiere aus diesem Visitenkarten-Text die Kontaktdaten als JSON. Antworte NUR mit dem JSON-Objekt, ohne Erklärung:

Text von der Visitenkarte:
${ocrText}

Erwartetes Format:
{
  "firstName": "",
  "lastName": "",
  "company": "",
  "position": "",
  "email": "",
  "phone": "",
  "mobile": "",
  "fax": "",
  "website": "",
  "street": "",
  "postalCode": "",
  "city": ""
}
Fülle nur Felder aus, die im Text eindeutig erkennbar sind. Lasse unbekannte Felder leer.`
          }],
          max_tokens: 500,
        }),
      })

      const structureResult = await structureResponse.json()
      const content = structureResult.choices?.[0]?.message?.content || ''

      // JSON extrahieren
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setBusinessCardOcrResult(parsed)

        // Duplikat-Prüfung
        const duplicates = await checkContactDuplicates(parsed)

        if (duplicates.length > 0) {
          // Duplikate gefunden - Dialog zeigen
          setDuplicateCheckResult({ checks: duplicates, ocrData: parsed })
          setDuplicateDialogOpen(true)
        } else {
          // Kein Duplikat - direkt Formular öffnen
          openContactFormWithOcrData(parsed)
        }
      } else {
        throw new Error('Konnte keine strukturierten Daten aus OCR-Text extrahieren')
      }
    } catch (err) {
      console.error('Visitenkarten-Scan fehlgeschlagen:', err)
      setContactSaveMessage('OCR fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'))
    } finally {
      setBusinessCardScanning(false)
      // Input zurücksetzen für erneuten Scan
      event.target.value = ''
    }
  }

  // Kontaktformular mit OCR-Daten öffnen
  const openContactFormWithOcrData = (ocrData, predecessorId = null, transitionDate = null) => {
    setEditingContact({ id: null })
    setContactSaveMessage('')
    setContactForm({
      firstName: ocrData.firstName || '',
      lastName: ocrData.lastName || '',
      company: ocrData.company || '',
      position: ocrData.position || '',
      email: ocrData.email || '',
      phone: ocrData.phone || '',
      mobile: ocrData.mobile || '',
      fax: ocrData.fax || '',
      website: ocrData.website || '',
      street: ocrData.street || '',
      postalCode: ocrData.postalCode || '',
      city: ocrData.city || '',
      country: 'DE',
      contactType: 'business',
      tags: [],
      notes: '',
      shared: true,
      businessCardUrl: '',
      businessCardUrlEnhanced: '',
      status: 'aktiv',
      predecessorId: predecessorId,
      transitionDate: transitionDate,
    })
    setDuplicateDialogOpen(false)
  }

  // Duplikat-Dialog: Bestehenden Kontakt aktualisieren
  const handleDuplicateUpdate = async (existingContact) => {
    setEditingContact(existingContact)
    setContactSaveMessage('')
    const ocrData = duplicateCheckResult?.ocrData || {}
    // Behalte das neue Foto (contactCardFile bleibt unverändert aus dem Scan)
    // Preview zeigt das neue Foto, businessCardUrl bleibt leer damit das neue Foto hochgeladen wird
    setContactForm({
      firstName: ocrData.firstName || existingContact.first_name || '',
      lastName: ocrData.lastName || existingContact.last_name || '',
      company: ocrData.company || existingContact.company || '',
      position: ocrData.position || existingContact.position || '',
      email: ocrData.email || existingContact.email || '',
      phone: ocrData.phone || existingContact.phone || '',
      mobile: ocrData.mobile || existingContact.mobile || '',
      fax: ocrData.fax || existingContact.fax || '',
      website: ocrData.website || existingContact.website || '',
      street: ocrData.street || existingContact.street || '',
      postalCode: ocrData.postalCode || existingContact.postal_code || '',
      city: ocrData.city || existingContact.city || '',
      country: existingContact.country || 'DE',
      contactType: existingContact.contact_type || 'business',
      tags: existingContact.tags || [],
      notes: existingContact.notes || '',
      shared: existingContact.shared ?? true,
      businessCardUrl: '', // Leer lassen - neues Foto wird beim Speichern hochgeladen
      businessCardUrlEnhanced: '', // Leer lassen - neues KI-Bild wird beim Speichern hochgeladen
      status: existingContact.status || 'aktiv',
      predecessorId: existingContact.predecessor_id || null,
      transitionDate: existingContact.transition_date || null,
    })
    // Preview zeigt das neue gescannte Foto (wurde in handleBusinessCardScan gesetzt)
    setDuplicateDialogOpen(false)
  }

  // Duplikat-Dialog: Neuer Vertreter (Vorgänger wird inaktiv)
  const handleNewRepresentative = async (predecessorContact) => {
    const today = new Date().toISOString().split('T')[0]

    // Alten Kontakt auf inaktiv setzen
    await supabase
      .from('contacts')
      .update({ status: 'inaktiv' })
      .eq('id', predecessorContact.id)

    // Neuen Kontakt mit Vorgänger-Referenz öffnen
    const ocrData = duplicateCheckResult?.ocrData || {}
    openContactFormWithOcrData(ocrData, predecessorContact.id, today)

    // Kontakte neu laden
    fetchContacts()
  }

  // Duplikat-Dialog: Komplett neuen Kontakt erstellen
  const handleCreateNewContact = () => {
    const ocrData = duplicateCheckResult?.ocrData || {}
    openContactFormWithOcrData(ocrData)
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!editingContact) return
    if (!contactForm.firstName.trim() && !contactForm.lastName.trim() && !contactForm.company.trim()) {
      setContactSaveMessage('Bitte mindestens Name oder Firma eingeben.')
      return
    }

    // Find current staff member for owner_id
    if (!currentStaff?.id) {
      setContactSaveMessage('Kein Mitarbeiter-Profil gefunden.')
      return
    }

    if (contactCardEnhancing) {
      setContactSaveMessage('KI-Verbesserung läuft noch, bitte kurz warten.')
      return
    }

    setContactSaveLoading(true)
    const payload = {
      owner_id: editingContact.owner_id || currentStaff.id,
      first_name: contactForm.firstName.trim(),
      last_name: contactForm.lastName.trim(),
      company: contactForm.company.trim(),
      position: contactForm.position.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      mobile: contactForm.mobile.trim(),
      fax: contactForm.fax.trim(),
      website: contactForm.website.trim(),
      street: contactForm.street.trim(),
      postal_code: contactForm.postalCode.trim(),
      city: contactForm.city.trim(),
      country: contactForm.country.trim() || 'DE',
      contact_type: contactForm.contactType,
      tags: contactForm.tags,
      notes: contactForm.notes.trim(),
      shared: contactForm.shared,
      business_card_url: contactForm.businessCardUrl || null,
      business_card_url_enhanced: contactForm.businessCardUrlEnhanced || null,
      status: contactForm.status || 'aktiv',
      predecessor_id: contactForm.predecessorId || null,
      transition_date: contactForm.transitionDate || null,
    }

    const uploadBusinessCard = async (contactId, file, suffix, contentType = 'image/jpeg') => {
      if (!file) return null
      // Bild drehen falls nötig
      const fileToUpload = suffix === 'original' && contactCardRotation !== 0
        ? await rotateImage(file, contactCardRotation)
        : file
      const filePath = `${contactId}/${Date.now()}-${suffix}.${contentType === 'image/png' ? 'png' : 'jpg'}`
      const { error: uploadError } = await supabase
        .storage
        .from('business-cards')
        .upload(filePath, fileToUpload, { upsert: true, contentType })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('business-cards')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingContact.id
    if (editingContact.id) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', editingContact.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setContactSaveMessage(saveError.message)
      setContactSaveLoading(false)
      return
    }

    if (contactCardFile && savedId) {
      try {
        const originalUrl = await uploadBusinessCard(savedId, contactCardFile, 'original', 'image/jpeg')
        const enhancedUrl = contactCardEnhancedFile
          ? await uploadBusinessCard(savedId, contactCardEnhancedFile, 'enhanced', contactCardEnhancedFile.type || 'image/png')
          : null
        const updatePayload = {
          business_card_url: originalUrl || contactForm.businessCardUrl || null,
          business_card_url_enhanced: enhancedUrl || contactForm.businessCardUrlEnhanced || null,
        }
        await supabase
          .from('contacts')
          .update(updatePayload)
          .eq('id', savedId)
      } catch (error) {
        setContactSaveMessage(error.message || 'Visitenkarte konnte nicht gespeichert werden.')
        setContactSaveLoading(false)
        return
      }
    }

    await fetchContacts()
    setContactSaveLoading(false)
    closeContactModal()
  }

  const deleteContact = async (contactId) => {
    if (!window.confirm('Kontakt wirklich löschen?')) return
    const { data: deletedContact, error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .select('business_card_url, business_card_url_enhanced')
      .single()
    if (error) {
      setContactsMessage(error.message)
      return
    } else {
      const urlsToDelete = [
        deletedContact?.business_card_url,
        deletedContact?.business_card_url_enhanced,
      ].filter(Boolean)
      const paths = urlsToDelete
        .map((url) => url.match(/business-cards\/(.+)$/))
        .filter(Boolean)
        .map((match) => match[1])
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from('business-cards').remove(paths)
        if (storageError) {
          setContactsMessage(`Kontakt gelöscht, aber Dateien konnten nicht entfernt werden: ${storageError.message}`)
        }
      }
      await fetchContacts()
    }
  }

  const contactTypeLabels = {
    business: 'Geschäftlich',
    supplier: 'Lieferant',
    customer: 'Kunde',
    employee: 'Mitarbeiter',
    other: 'Sonstige',
  }

  // Kontakte filtern nach Suchbegriff
  const filteredContacts = contacts.filter((contact) => {
    if (!contactSearch.trim()) return true
    const search = contactSearch.toLowerCase()
    return (
      (contact.first_name || '').toLowerCase().includes(search) ||
      (contact.last_name || '').toLowerCase().includes(search) ||
      (contact.company || '').toLowerCase().includes(search) ||
      (contact.position || '').toLowerCase().includes(search) ||
      (contact.email || '').toLowerCase().includes(search) ||
      (contact.phone || '').toLowerCase().includes(search) ||
      (contact.mobile || '').toLowerCase().includes(search) ||
      (contact.street || '').toLowerCase().includes(search) ||
      (contact.postal_code || '').toLowerCase().includes(search) ||
      (contact.city || '').toLowerCase().includes(search) ||
      (contact.notes || '').toLowerCase().includes(search)
    )
  })

  const openContactDetail = (contact) => {
    setSelectedContact(contact)
    setSelectedContactCardView(contact.business_card_url_enhanced ? 'enhanced' : 'original')
  }

  const getContactCardUrl = (contact, view = 'enhanced') => {
    if (!contact) return ''
    if (view === 'enhanced' && contact.business_card_url_enhanced) {
      return contact.business_card_url_enhanced
    }
    return contact.business_card_url || contact.business_card_url_enhanced || ''
  }

  const selectedCardUrl = selectedContact
    ? getContactCardUrl(selectedContact, selectedContactCardView)
    : ''
  const selectedCardHasEnhanced = !!selectedContact?.business_card_url_enhanced
  const selectedCardHasOriginal = !!selectedContact?.business_card_url

  const fetchChatMessages = async () => {
    setChatLoading(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, message, created_at')
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      setChatError(error.message)
      setChatMessages([])
    } else {
      setChatError('')
      setChatMessages(data || [])
    }
    setChatLoading(false)
  }

  const sendChatMessage = async (event) => {
    event.preventDefault()
    if (!chatInput.trim() || !session?.user?.id) return
    setChatSending(true)
    setChatError('')
    const { error } = await supabase
      .from('chat_messages')
      .insert({ user_id: session.user.id, message: chatInput.trim() })

    if (error) {
      setChatError(error.message)
    } else {
      setChatInput('')
    }
    setChatSending(false)
  }

  // Dokumentationen laden (AMK oder Recall)
  const loadDokumentationen = async (messageId, messageType = 'amk') => {
    setDokumentationLoading(true)
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, messageId)
      .order('erstellt_am', { ascending: false })

    if (!error && data) {
      setExistingDokumentationen(data)
    } else {
      setExistingDokumentationen([])
    }
    setDokumentationLoading(false)
  }

  // Signature Canvas initialisieren
  const initSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    signatureCtxRef.current = ctx
    // Canvas leeren
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      e.preventDefault()
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      signatureCtxRef.current?.closePath()
      setIsDrawing(false)
      // Signatur als Base64 speichern
      const canvas = signatureCanvasRef.current
      if (canvas) {
        setDokumentationSignature(canvas.toDataURL('image/png'))
      }
    }
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setDokumentationSignature(null)
    }
  }

  // Dokumentation speichern (AMK oder Recall)
  const saveDokumentation = async () => {
    const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
    if (!selectedApoMessage?.id || (!dokumentationBemerkung.trim() && !dokumentationSignature && !hasSavedPznFotos)) return

    const messageType = selectedApoMessage.type
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    // Name des eingeloggten Nutzers ermitteln
    const currentStaffMember = staffByAuthId[session?.user?.id]
    const userName = currentStaffMember
      ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
      : session?.user?.email || 'Unbekannt'

    setDokumentationLoading(true)

    // PZN-Fotos aus der recall_pzn_fotos Tabelle in die Dokumentation kopieren
    const pznFotoPaths = messageType === 'recall' && hasSavedPznFotos ? savedPznFotos : null

    const { error } = await supabase
      .from(tableName)
      .insert({
        [idColumn]: selectedApoMessage.id,
        bemerkung: dokumentationBemerkung.trim() || null,
        unterschrift_data: dokumentationSignature || null,
        erstellt_von: session?.user?.id || null,
        erstellt_von_name: userName,
        pharmacy_id: pharmacies[0]?.id || null,
        ...(pznFotoPaths ? { pzn_fotos: pznFotoPaths } : {})
      })

    if (!error) {
      // Dokumentationen neu laden (für Button-Status)
      await loadDokumentationen(selectedApoMessage.id, messageType)
      // Liste aktualisieren (für Karten-Status)
      if (messageType === 'recall') {
        fetchRecallMessages(apoYear)
      } else {
        fetchAmkMessages(apoYear)
      }
      // Modal schließen nach erfolgreichem Speichern
      setShowDokumentationModal(false)
      setShowSignatureCanvas(false)
      setDokumentationBemerkung('')
      setDokumentationSignature(null)
    }
    setDokumentationLoading(false)
  }

  // PZN-Fotos aus Datenbank laden
  const loadSavedPznFotos = async (recallMessageId) => {
    const { data, error } = await supabase
      .from('recall_pzn_fotos')
      .select('pzn, foto_path')
      .eq('recall_message_id', recallMessageId)

    if (!error && data) {
      const fotosMap = {}
      data.forEach(item => {
        fotosMap[item.pzn] = item.foto_path
      })
      setSavedPznFotos(fotosMap)
    } else {
      setSavedPznFotos({})
    }
  }

  // PZN-Foto Handler
  const handlePznClick = (pzn) => {
    if (pznFotoUploading) return
    setActivePzn(pzn)
    pznCameraInputRef.current?.click()
  }

  const handlePznCameraCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !activePzn || !selectedApoMessage?.id) return

    setPznFotoUploading(true)

    try {
      // Bestehende compressImage Funktion nutzen (max 800px, 0.7 quality)
      const compressed = await compressImage(file, 800, 0.7)

      // Foto sofort nach Storage hochladen
      const fileName = `${Date.now()}-${activePzn}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('recall-fotos')
        .upload(fileName, compressed)

      if (uploadError) {
        console.error('Foto-Upload fehlgeschlagen:', uploadError.message)
        return
      }

      // Name des eingeloggten Nutzers ermitteln
      const currentStaffMember = staffByAuthId[session?.user?.id]
      const userName = currentStaffMember
        ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
        : session?.user?.email || 'Unbekannt'

      // In Datenbank speichern (upsert - ersetzt bestehendes Foto für diese PZN)
      const { error: dbError } = await supabase
        .from('recall_pzn_fotos')
        .upsert({
          recall_message_id: selectedApoMessage.id,
          pzn: activePzn,
          foto_path: fileName,
          erstellt_von: session?.user?.id || null,
          erstellt_von_name: userName
        }, {
          onConflict: 'recall_message_id,pzn'
        })

      if (!dbError) {
        // State aktualisieren
        setSavedPznFotos(prev => ({
          ...prev,
          [activePzn]: fileName
        }))
      }
    } catch (e) {
      console.error('Fehler beim Speichern des PZN-Fotos:', e)
    } finally {
      setPznFotoUploading(false)
      setActivePzn(null)
      event.target.value = ''  // Reset für erneute Auswahl
    }
  }

  const fetchPlanData = async () => {
    setPlanLoading(true)
    setPlanError('')
    setPlanData(null)

    try {
      const { data: files, error: listError } = await supabase
        .storage
        .from('tagesmep')
        .list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } })

      if (listError) throw listError
      if (!files || files.length === 0) throw new Error('Keine XML-Dateien im Bucket gefunden.')

      const xmlFiles = files
        .filter((f) => f.name.endsWith('.xml'))
        .sort((a, b) => b.name.localeCompare(a.name))

      if (xmlFiles.length === 0) throw new Error('Keine XML-Dateien gefunden.')

      let xmlContent = null
      let usedFile = null

      for (const file of xmlFiles) {
        const { data, error: downloadError } = await supabase
          .storage
          .from('tagesmep')
          .download(file.name)

        if (!downloadError && data) {
          xmlContent = await data.text()
          usedFile = file.name
          break
        }
      }

      if (!xmlContent) throw new Error('Konnte keine XML-Datei laden.')

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) throw new Error('XML konnte nicht geparst werden.')

      const reportDate = xmlDoc.documentElement.getAttribute('date') || ''
      const orgGroups = xmlDoc.querySelectorAll('orggroup')
      const parsed = { reportDate, usedFile, days: {} }

      orgGroups.forEach((group) => {
        const issueDate = group.getAttribute('issueDate') || ''
        const groupName = group.getAttribute('name') || ''
        const dateMatch = issueDate.match(/(\d{2}\.\d{2}\.\d{4})/)
        const dateKey = dateMatch ? dateMatch[1] : issueDate

        if (!parsed.days[dateKey]) {
          parsed.days[dateKey] = { issueDate, groups: {} }
        }

        if (!parsed.days[dateKey].groups[groupName]) {
          parsed.days[dateKey].groups[groupName] = []
        }

        const employees = group.querySelectorAll('employee')
        employees.forEach((emp) => {
          const visible = emp.querySelector('visible')?.textContent
          if (visible !== 'true') return

          const firstName = emp.getAttribute('firstName') || ''
          const lastName = emp.getAttribute('lastName') || ''
          const workStart = emp.getAttribute('workStart') || ''
          const workStop = emp.getAttribute('workStop') || ''
          const color = emp.getAttribute('color') || ''

          const planEl = emp.querySelector('plan')
          const timeblocks = []
          if (planEl) {
            planEl.querySelectorAll('timeblock').forEach((tb) => {
              timeblocks.push({
                type: tb.getAttribute('type') || '',
                duration: parseInt(tb.getAttribute('duration') || '0', 10),
                color1: tb.getAttribute('color1') || '',
                text: tb.textContent?.trim() || '',
              })
            })
          }

          let status = ''
          const workBlock = timeblocks.find((tb) => tb.type === 'work' && tb.text)
          if (workBlock) {
            const txt = workBlock.text.toLowerCase()
            if (txt.includes('urlaub')) status = 'Urlaub'
            else if (txt.includes('krankheit') || txt.includes('krank')) status = 'Krank'
            else if (workStart && workStop) status = ''
          }

          parsed.days[dateKey].groups[groupName].push({
            firstName,
            lastName,
            workStart,
            workStop,
            color,
            status,
            timeblocks,
          })
        })
      })

      setPlanData(parsed)
    } catch (err) {
      setPlanError(err.message || 'Fehler beim Laden der Plandaten.')
    } finally {
      setPlanLoading(false)
    }
  }

  // ============================================
  // KALENDER-SYSTEM FUNKTIONEN
  // ============================================

  const fetchCalendars = async () => {
    setCalendarsLoading(true)
    setCalendarsError('')

    const { data, error } = await supabase
      .from('calendars')
      .select(`
        id,
        name,
        description,
        color,
        created_by,
        created_at,
        is_active,
        calendar_permissions(permission)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      setCalendarsError(error.message)
      setCalendars([])
    } else {
      const calendarsWithPermission = (data || []).map((cal) => ({
        ...cal,
        userPermission: cal.calendar_permissions?.[0]?.permission || 'read',
      }))
      setCalendars(calendarsWithPermission)

      // Standard: "Alle Kalender" Ansicht
      if (!selectedCalendarId && calendarsWithPermission.length > 0) {
        setSelectedCalendarId('all')
      }
    }
    setCalendarsLoading(false)
  }

  const getCalendarViewRange = () => {
    const d = new Date(calendarViewDate)
    let startDate, endDate

    if (calendarViewMode === 'month') {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1)
      startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7)
    } else if (calendarViewMode === 'week') {
      startDate = new Date(d)
      startDate.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate = new Date(d)
      endDate = new Date(d)
      endDate.setDate(endDate.getDate() + 1)  // +1 Tag für ganztägige Termine
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    return { startDate, endDate }
  }

  const fetchCalendarEvents = async (calendarId) => {
    if (!calendarId) return
    setEventsLoading(true)

    const { startDate, endDate } = getCalendarViewRange()

    let query = supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true })

    // Bei "all" alle Kalender laden, sonst nur den ausgewählten
    if (calendarId !== 'all') {
      query = query.eq('calendar_id', calendarId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Events laden fehlgeschlagen:', error.message)
      setCalendarEvents([])
    } else {
      setCalendarEvents(data || [])
    }
    setEventsLoading(false)
  }

  const fetchCalendarPermissions = async (calendarId) => {
    setPermissionsLoading(true)

    const { data, error } = await supabase
      .from('calendar_permissions')
      .select('id, user_id, permission, granted_by, created_at')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const permissionsWithStaff = data.map((perm) => ({
        ...perm,
        staffMember: staff.find((s) => s.auth_user_id === perm.user_id),
      }))
      setCalendarPermissions(permissionsWithStaff)
    }
    setPermissionsLoading(false)
  }

  // Dashboard: Alle Termine laden (für Widget)
  const fetchDashboardEvents = async () => {
    setDashboardEventsLoading(true)

    // Erst Kalender laden um Notdienst zu identifizieren
    const { data: calsData } = await supabase
      .from('calendars')
      .select('id, name, color')
      .eq('is_active', true)

    const calendarsList = calsData || []

    // Termine der nächsten 30 Tage laden
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 30)
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`

    const { data: eventsData, error } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', todayStr)
      .lte('start_time', futureStr + 'T23:59:59')
      .order('start_time', { ascending: true })

    if (!error && eventsData) {
      // Events mit Kalenderinfo anreichern
      const enrichedEvents = eventsData.map((event) => {
        const cal = calendarsList.find((c) => c.id === event.calendar_id)
        return {
          ...event,
          calendarName: cal?.name || '',
          calendarColor: cal?.color || '#6B7280',
        }
      })
      setDashboardEvents(enrichedEvents)
    }
    setDashboardEventsLoading(false)
  }

  const createCalendar = async () => {
    if (!calendarForm.name.trim()) return
    setCalendarSaving(true)

    const { data, error } = await supabase
      .from('calendars')
      .insert({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await supabase
        .from('calendar_permissions')
        .insert({
          calendar_id: data.id,
          user_id: session.user.id,
          permission: 'write',
          granted_by: session.user.id,
        })

      await fetchCalendars()
      setEditingCalendar(null)
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
    setCalendarSaving(false)
  }

  const updateCalendar = async (calendarId) => {
    setCalendarSaving(true)

    const { error } = await supabase
      .from('calendars')
      .update({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calendarId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendars()
      setEditingCalendar(null)
    }
    setCalendarSaving(false)
  }

  const createEvent = async () => {
    if (!eventForm.title.trim() || !selectedCalendarId) return
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .insert({
        calendar_id: selectedCalendarId,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
        created_by: session.user.id,
      })

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  const updateEvent = async (eventId) => {
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  const deleteEvent = async (eventId) => {
    if (!confirm('Termin unwiderruflich löschen?')) return

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
  }

  const addCalendarPermission = async (calendarId, userId, permission) => {
    const { error } = await supabase
      .from('calendar_permissions')
      .upsert(
        {
          calendar_id: calendarId,
          user_id: userId,
          permission: permission,
          granted_by: session.user.id,
        },
        { onConflict: 'calendar_id,user_id' },
      )

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarPermissions(calendarId)
    }
  }

  const removeCalendarPermission = async (permissionId, calendarId) => {
    const { error } = await supabase
      .from('calendar_permissions')
      .delete()
      .eq('id', permissionId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarPermissions(calendarId)
    }
  }

  const openEventModal = (event = null, clickedDate = null) => {
    const today = clickedDate || new Date()
    // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    if (event) {
      // Datum direkt aus String extrahieren (vermeidet Zeitzonenprobleme)
      const startDate = event.start_time.substring(0, 10)
      const endDate = event.end_time.substring(0, 10)
      // Zeit aus Date-Objekt für lokale Anzeige
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      setEditingEvent(event)
      setEventForm({
        title: event.title,
        description: event.description || '',
        startDate: startDate,
        startTime: start.toTimeString().slice(0, 5),
        endDate: endDate,
        endTime: end.toTimeString().slice(0, 5),
        allDay: event.all_day,
        location: event.location || '',
      })
    } else {
      setEditingEvent({ id: null })
      setEventForm({
        title: '',
        description: '',
        startDate: todayStr,
        startTime: '09:00',
        endDate: todayStr,
        endTime: '10:00',
        allDay: false,
        location: '',
      })
    }
    setEventError('')
  }

  const closeEventModal = () => {
    setEditingEvent(null)
    setEventError('')
  }

  const openCalendarModal = (calendar = null) => {
    if (calendar) {
      setEditingCalendar(calendar)
      setCalendarForm({
        name: calendar.name,
        description: calendar.description || '',
        color: calendar.color || '#10b981',
      })
    } else {
      setEditingCalendar({ id: null })
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
  }

  const closeCalendarModal = () => {
    setEditingCalendar(null)
  }

  const currentCalendarPermission = () => {
    // Bei "Alle Kalender" keine Schreibberechtigung (man muss einen spezifischen Kalender wählen)
    if (selectedCalendarId === 'all') return null
    if (currentStaff?.is_admin) return 'write'
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission || null
  }

  const canWriteCurrentCalendar = () => currentCalendarPermission() === 'write'

  // Hilfsfunktion: Farbe für ein Event basierend auf seinem Kalender
  const getEventColor = (event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#10b981'
  }

  const weatherDescription = (code) => {
    const map = {
      0: 'Klar',
      1: 'Überwiegend klar',
      2: 'Leicht bewölkt',
      3: 'Bedeckt',
      45: 'Nebel',
      48: 'Reifnebel',
      51: 'Nieselregen',
      53: 'Nieselregen',
      55: 'Nieselregen',
      61: 'Regen',
      63: 'Regen',
      65: 'Starker Regen',
      71: 'Schnee',
      73: 'Schnee',
      75: 'Starker Schnee',
      80: 'Schauer',
      81: 'Schauer',
      82: 'Starke Schauer',
      95: 'Gewitter',
    }
    return map[code] || 'Wetter'
  }

  const WeatherIcon = ({ code, className = "w-5 h-5" }) => {
    // 0: Klar, 1-3: Bewölkt, 45-48: Nebel, 51-55: Niesel, 61-65: Regen, 71-75: Schnee, 80-82: Schauer, 95: Gewitter
    if (code === 0) return <Icons.SunLarge className={className} />
    if (code === 1 || code === 2) return <Icons.CloudSun className={className} />
    if (code === 3) return <Icons.Cloud className={className} />
    if (code === 45 || code === 48) return <Icons.CloudFog className={className} />
    if (code >= 51 && code <= 55) return <Icons.CloudRain className={className} />
    if (code >= 61 && code <= 65) return <Icons.CloudRain className={className} />
    if (code >= 71 && code <= 75) return <Icons.CloudSnow className={className} />
    if (code >= 80 && code <= 82) return <Icons.CloudRain className={className} />
    if (code === 95) return <Icons.CloudBolt className={className} />
    return <Icons.Cloud className={className} />
  }

  const fetchWeather = async (location) => {
    if (!location) return
    setWeatherLoading(true)
    setWeatherError('')
    setWeatherData(null)
    try {
      const geocode = async (query) => {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`,
        )
        if (!geoResponse.ok) return null
        const geoData = await geoResponse.json()
        return geoData.results && geoData.results[0]
      }

      const parts = location.split(' ').filter(Boolean)
      const cityOnly = parts.length > 1 ? parts.slice(1).join(' ') : location
      const candidates = [location, cityOnly, parts[0]].filter(Boolean)
      let result = null
      for (const candidate of candidates) {
        result = await geocode(candidate)
        if (result) break
      }

      if (!result) throw new Error('Ort nicht gefunden.')

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weathercode,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,sunrise,sunset&forecast_days=5&timezone=auto`,
      )
      if (!weatherResponse.ok) throw new Error('Wetterdaten konnten nicht geladen werden.')
      const weatherJson = await weatherResponse.json()
      const daily = weatherJson.daily || {}
      const dailyEntries = (daily.time || []).map((date, index) => ({
        date,
        min: daily.temperature_2m_min?.[index],
        max: daily.temperature_2m_max?.[index],
        precipitation: daily.precipitation_sum?.[index],
        precipitationProbability: daily.precipitation_probability_max?.[index],
        weatherCode: daily.weathercode?.[index],
        sunrise: daily.sunrise?.[index],
        sunset: daily.sunset?.[index],
      }))
      setWeatherData({
        name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
        temperature: weatherJson.current?.temperature_2m,
        feelsLike: weatherJson.current?.apparent_temperature,
        humidity: weatherJson.current?.relative_humidity_2m,
        precipitation: weatherJson.current?.precipitation,
        weatherCode: weatherJson.current?.weathercode,
        wind: weatherJson.current?.wind_speed_10m,
        daily: dailyEntries,
      })
    } catch (error) {
      setWeatherError(error.message || 'Fehler beim Laden der Wetterdaten.')
    } finally {
      setWeatherLoading(false)
    }
  }

  const openWeatherModal = () => {
    setWeatherInput(weatherLocation)
    setWeatherModalOpen(true)
  }

  const closeWeatherModal = () => {
    setWeatherModalOpen(false)
  }

  const handleEditInput = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreateModal = () => {
    setEditingPharmacy({ id: null })
    setEditMessage('')
    setEditForm({
      name: '',
      street: '',
      postalCode: '',
      city: '',
      phone: '',
      owner: '',
      ownerRole: '',
      website: '',
      email: '',
      fax: '',
    })
    setWeatherModalOpen(false)
  }

  const openEditModal = (pharmacy) => {
    setEditingPharmacy(pharmacy)
    setEditMessage('')
    setEditForm({
      name: pharmacy.name || '',
      street: pharmacy.street || '',
      postalCode: pharmacy.postal_code || '',
      city: pharmacy.city || '',
      phone: pharmacy.phone || '',
      owner: pharmacy.owner || '',
      ownerRole: pharmacy.owner_role || '',
      website: pharmacy.website || '',
      email: pharmacy.email || '',
      fax: pharmacy.fax || '',
    })
  }

  const closeEditModal = () => {
    setEditingPharmacy(null)
    setEditMessage('')
  }

  const openStaffModal = (member = null) => {
    const fallbackPharmacyId = pharmacies[0]?.id || ''
    setEditingStaff(member || { id: null })
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffForm({
      firstName: member?.first_name || '',
      lastName: member?.last_name || '',
      street: member?.street || '',
      postalCode: member?.postal_code || '',
      city: member?.city || '',
      mobile: member?.mobile || '',
      email: member?.email || '',
      role: member?.role || '',
      pharmacyId: member?.pharmacy_id || fallbackPharmacyId,
      authUserId: member?.auth_user_id || '',
      isAdmin: member?.is_admin || false,
      avatarUrl: member?.avatar_url || '',
      employedSince: member?.employed_since || '',
    })
    setStaffAvatarFile(null)
    setStaffAvatarPreview(member?.avatar_url || '')
  }

  const closeStaffModal = () => {
    setEditingStaff(null)
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffAvatarFile(null)
    setStaffAvatarPreview('')
  }

  const handleStaffInput = (field, value) => {
    setStaffForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStaffAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setStaffAvatarFile(file)
    setStaffAvatarPreview(URL.createObjectURL(file))
  }

  const fetchLatestPhoto = async () => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data || data.length === 0) {
      setLatestPhoto(null)
      return
    }
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(`photos/${data[0].name}`)
    setLatestPhoto({ name: data[0].name, url: urlData.publicUrl, createdAt: data[0].created_at })
  }

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `photos/${fileName}`
    const { error } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file)
    if (error) {
      console.error('Foto-Upload fehlgeschlagen:', error.message)
      setPhotoUploading(false)
      return
    }
    await fetchLatestPhoto()
    await fetchAllPhotos()
    setPhotoUploading(false)

    // OCR im Hintergrund starten
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath)
    if (urlData?.publicUrl) {
      runOcrForPhoto(fileName, urlData.publicUrl)
    }
  }

  const fetchAllPhotos = async () => {
    setPhotosLoading(true)
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data) {
      setAllPhotos([])
      setPhotosLoading(false)
      return
    }
    const photosWithUrls = data.map((file) => {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(`photos/${file.name}`)
      const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG'
      const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : null
      return {
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at,
        format: ext,
        sizeKB,
      }
    })
    setAllPhotos(photosWithUrls)
    setPhotosLoading(false)
  }

  const deletePhoto = async (photoName, event) => {
    event.stopPropagation()
    if (!confirm('Foto unwiderruflich löschen?')) return
    const { data, error } = await supabase
      .storage
      .from('documents')
      .remove([`photos/${photoName}`])
    console.log('Delete response:', { data, error, photoName })
    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert('Foto konnte nicht gelöscht werden. Prüfe die Storage-Berechtigungen.')
      return
    }
    setAllPhotos((prev) => prev.filter((p) => p.name !== photoName))
    await fetchLatestPhoto()
  }

  const fetchBusinessCards = async () => {
    setBusinessCardsLoading(true)
    try {
      // Hole alle Kontakte mit Visitenkarten-URL
      const { data: contactsWithCards, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, business_card_url, business_card_url_enhanced, created_at')
        .or('business_card_url.not.is.null,business_card_url_enhanced.not.is.null')
        .order('created_at', { ascending: false })

      if (error || !contactsWithCards) {
        console.error('Fehler beim Laden der Visitenkarten:', error)
        setBusinessCards([])
        setBusinessCardsLoading(false)
        return
      }

      const cards = contactsWithCards
        .filter((contact) => contact.business_card_url_enhanced || contact.business_card_url)
        .map((contact) => {
          const url = contact.business_card_url_enhanced || contact.business_card_url
          const ext = url.split('.').pop()?.toUpperCase() || 'JPG'
          return {
            id: contact.id,
            contactName: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unbekannt',
            company: contact.company || '',
            url: url,
            originalUrl: contact.business_card_url || '',
            enhancedUrl: contact.business_card_url_enhanced || '',
            createdAt: contact.created_at,
            format: ext,
          }
        })
      setBusinessCards(cards)
    } catch (err) {
      console.error('Fehler beim Laden der Visitenkarten:', err)
      setBusinessCards([])
    }
    setBusinessCardsLoading(false)
  }

  const deleteBusinessCard = async (card, event) => {
    event.stopPropagation()
    if (!confirm(`Visitenkarte von "${card.contactName}" unwiderruflich löschen?`)) return

    // Lösche die URL aus dem Kontakt
    const { error } = await supabase
      .from('contacts')
      .update({ business_card_url: null, business_card_url_enhanced: null })
      .eq('id', card.id)

    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }

    // Optional: Versuche auch die Datei aus dem Storage zu löschen (falls im eigenen Bucket)
    const urlsToDelete = [card.originalUrl, card.enhancedUrl, card.url].filter(Boolean)
    const paths = urlsToDelete
      .map((url) => url.match(/business-cards\/(.+)$/))
      .filter(Boolean)
      .map((match) => match[1])
    if (paths.length > 0) {
      await supabase.storage.from('business-cards').remove(paths)
    }

    setBusinessCards((prev) => prev.filter((c) => c.id !== card.id))
  }

  const fetchMistralApiKey = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Mistral')
      .single()
    if (!error && data) {
      setMistralApiKey(data.key)
      return data.key
    }
    return null
  }

  const fetchGoogleApiKey = async () => {
    console.log('fetchGoogleApiKey: Suche nach Google Nano Banana Key...')
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Google Nano Banana')
      .single()
    console.log('fetchGoogleApiKey Result:', { found: !!data, error: error?.message })
    if (!error && data) {
      setGoogleApiKey(data.key)
      return data.key
    }

    // Fallback: Suche nach ähnlichen Namen
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('api_keys')
      .select('key')
      .ilike('name', '%google%nano%banana%')
      .limit(1)
      .single()
    console.log('fetchGoogleApiKey Fallback:', { found: !!fallbackData, error: fallbackError?.message })
    if (!fallbackError && fallbackData) {
      setGoogleApiKey(fallbackData.key)
      return fallbackData.key
    }

    return null
  }

  const fetchPhotoOcrData = async () => {
    const { data, error } = await supabase
      .from('photo_ocr')
      .select('photo_name, ocr_text, ocr_status')
    if (!error && data) {
      const ocrMap = {}
      data.forEach((item) => {
        ocrMap[item.photo_name] = { text: item.ocr_text, status: item.ocr_status }
      })
      setPhotoOcrData(ocrMap)
    }
  }

  const runOcrForPhoto = async (photoName, photoUrl) => {
    let apiKey = mistralApiKey
    if (!apiKey) {
      apiKey = await fetchMistralApiKey()
    }
    if (!apiKey) {
      console.error('Mistral API Key nicht gefunden')
      return
    }

    setOcrProcessing((prev) => ({ ...prev, [photoName]: true }))

    try {
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: photoUrl,
          },
        }),
      })

      const result = await response.json()
      let ocrText = ''

      if (result.pages && result.pages.length > 0) {
        ocrText = result.pages.map((p) => p.markdown || p.text || '').join('\n')
      } else if (result.text) {
        ocrText = result.text
      } else if (result.content) {
        ocrText = result.content
      }

      const { error } = await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: ocrText || '(kein Text erkannt)',
          ocr_status: 'completed',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })

      if (!error) {
        setPhotoOcrData((prev) => ({
          ...prev,
          [photoName]: { text: ocrText || '(kein Text erkannt)', status: 'completed' },
        }))
      }
    } catch (err) {
      console.error('OCR fehlgeschlagen:', err)
      await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: '',
          ocr_status: 'error',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })
      setPhotoOcrData((prev) => ({
        ...prev,
        [photoName]: { text: '', status: 'error' },
      }))
    } finally {
      setOcrProcessing((prev) => ({ ...prev, [photoName]: false }))
    }
  }

  const openPhotoEditor = (photo) => {
    setSelectedPhoto(photo)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setBrightness(100)
    setContrast(100)
    setPhotoEditorOpen(true)
  }

  const closePhotoEditor = () => {
    setPhotoEditorOpen(false)
    setSelectedPhoto(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  const fetchAmkMessages = async (year) => {
    setAmkLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_amk_messages')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle AMK-Meldungen laden
      const amkIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('amk_dokumentationen')
        .select('*')
        .in('amk_message_id', amkIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Meldungen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.amk_message_id]) {
            doksById[dok.amk_message_id] = []
          }
          doksById[dok.amk_message_id].push(dok)
        }
      }

      // Meldungen mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setAmkMessages(enrichedData)
    } else {
      setAmkMessages([])
    }
    setAmkLoading(false)
  }

  const fetchRecallMessages = async (year) => {
    setRecallLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_recall')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle Rückrufe laden
      const recallIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('recall_dokumentationen')
        .select('*')
        .in('recall_message_id', recallIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Rückrufen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.recall_message_id]) {
            doksById[dok.recall_message_id] = []
          }
          doksById[dok.recall_message_id].push(dok)
        }
      }

      // Rückrufe mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setRecallMessages(enrichedData)
    } else {
      setRecallMessages([])
    }
    setRecallLoading(false)
  }

  const fetchLavAusgaben = async (year) => {
    setLavLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('lav_ausgaben')
      .select(`
        *,
        lav_themes (*)
      `)
      .gte('datum', startDate)
      .lte('datum', endDate)
      .order('datum', { ascending: false })
    if (!error && data) {
      setLavAusgaben(data)
    } else {
      setLavAusgaben([])
    }
    setLavLoading(false)
  }

  // Ungelesene Meldungen zählen
  const fetchUnreadCounts = async (year) => {
    if (!session?.user?.id) return
    const { data, error } = await supabase.rpc('get_unread_counts', {
      p_user_id: session.user.id,
      p_year: year,
    })
    if (!error && data) {
      const counts = { amk: 0, recall: 0, lav: 0 }
      data.forEach((row) => {
        counts[row.message_type] = Number(row.unread_count)
      })
      setUnreadCounts(counts)
    }
  }

  // IDs der gelesenen Meldungen laden (für Karten-Hervorhebung)
  const fetchReadMessageIds = async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('message_read_status')
      .select('message_type, message_id')
      .eq('user_id', session.user.id)
    if (!error && data) {
      const ids = { amk: new Set(), recall: new Set(), lav: new Set() }
      data.forEach((row) => {
        ids[row.message_type].add(row.message_id)
      })
      setReadMessageIds(ids)
    }
  }

  // Meldung als gelesen markieren
  const markAsRead = async (messageType, messageId) => {
    if (!session?.user?.id) return
    const idStr = String(messageId)
    // Prüfen ob bereits gelesen
    if (readMessageIds[messageType].has(idStr)) return
    const { error } = await supabase.from('message_read_status').insert({
      user_id: session.user.id,
      message_type: messageType,
      message_id: idStr,
    })
    if (error) {
      // Duplikat-Fehler ignorieren (bereits gelesen)
      if (error.code !== '23505') {
        console.error('markAsRead error:', error)
      }
      return
    }
    if (!error) {
      // Lokalen State aktualisieren
      setUnreadCounts((prev) => ({
        ...prev,
        [messageType]: Math.max(0, prev[messageType] - 1),
      }))
      setReadMessageIds((prev) => {
        const newIds = { ...prev }
        newIds[messageType] = new Set(prev[messageType])
        newIds[messageType].add(idStr)
        return newIds
      })
    }
  }

  const changeApoYear = (delta) => {
    setApoYear((prev) => prev + delta)
  }

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  const groupByMonth = (items, dateField) => {
    const groups = {}
    items.forEach((item) => {
      const dateValue = item[dateField]
      if (dateValue) {
        const month = new Date(dateValue).getMonth()
        if (!groups[month]) groups[month] = []
        groups[month].push(item)
      }
    })
    return [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      .filter((m) => groups[m] && groups[m].length > 0)
      .map((m) => ({ month: m, items: groups[m] }))
  }

  const filterApoItems = (items, searchTerm, type) => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter((item) => {
      if (type === 'amk' || type === 'recall') {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.full_text?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.product_name?.toLowerCase().includes(term)
        )
      } else if (type === 'lav') {
        const themeMatch = item.lav_themes?.some((t) => t.titel?.toLowerCase().includes(term))
        return (
          item.subject?.toLowerCase().includes(term) ||
          themeMatch
        )
      }
      return false
    })
  }

  const saveEditedPhoto = async () => {
    if (!selectedPhoto || !photoImgRef.current) return
    setPhotoSaving(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const image = photoImgRef.current

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    if (completedCrop) {
      canvas.width = completedCrop.width * scaleX
      canvas.height = completedCrop.height * scaleY
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0,
        canvas.width,
        canvas.height
      )
    } else {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(image, 0, 0)
    }

    canvas.toBlob(async (blob) => {
      const fileName = `edited_${Date.now()}.jpg`
      const filePath = `photos/${fileName}`
      const { error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, blob)
      if (error) {
        console.error('Speichern fehlgeschlagen:', error.message)
      } else {
        await fetchAllPhotos()
        await fetchLatestPhoto()
        closePhotoEditor()
      }
      setPhotoSaving(false)
    }, 'image/jpeg', 0.9)
  }

  const linkCurrentUser = () => {
    if (!session?.user?.id) return
    setStaffForm((prev) => ({
      ...prev,
      authUserId: session.user.id,
      email: prev.email || session.user.email || '',
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingPharmacy) return
    if (!editingPharmacy.id && pharmacies.length >= 4) {
      setEditMessage('Maximal 4 Apotheken erlaubt.')
      return
    }
    if (!editForm.name.trim()) {
      setEditMessage('Bitte einen Namen eingeben.')
      return
    }
    if (!editForm.ownerRole) {
      setEditMessage('Bitte Inhaber oder Filialleiter wählen.')
      return
    }

    setEditLoading(true)
    const payload = {
      name: editForm.name.trim(),
      street: editForm.street.trim(),
      postal_code: editForm.postalCode.trim(),
      city: editForm.city.trim(),
      phone: editForm.phone.trim(),
      owner: editForm.owner.trim(),
      owner_role: editForm.ownerRole,
      website: editForm.website.trim(),
      email: editForm.email.trim(),
      fax: editForm.fax.trim(),
    }

    const { error } = editingPharmacy.id
      ? await supabase
          .from('pharmacies')
          .update(payload)
          .eq('id', editingPharmacy.id)
      : await supabase
          .from('pharmacies')
          .insert(payload)

    if (error) {
      setEditMessage(error.message)
      setEditLoading(false)
      return
    }

    await fetchPharmacies()
    setEditLoading(false)
    closeEditModal()
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    if (!editingStaff) return
    if (!staffForm.firstName.trim() || !staffForm.lastName.trim()) {
      setStaffSaveMessage('Bitte Vor- und Nachnamen eingeben.')
      return
    }
    if (!staffForm.role) {
      setStaffSaveMessage('Bitte Beruf wählen.')
      return
    }
    if (!staffForm.pharmacyId) {
      setStaffSaveMessage('Bitte Apotheke zuordnen.')
      return
    }

    setStaffSaveLoading(true)
    const payload = {
      first_name: staffForm.firstName.trim(),
      last_name: staffForm.lastName.trim(),
      street: staffForm.street.trim(),
      postal_code: staffForm.postalCode.trim(),
      city: staffForm.city.trim(),
      mobile: staffForm.mobile.trim(),
      email: staffForm.email.trim(),
      role: staffForm.role,
      pharmacy_id: staffForm.pharmacyId,
      auth_user_id: staffForm.authUserId || null,
      is_admin: staffForm.isAdmin,
      avatar_url: staffForm.avatarUrl || null,
      employed_since: staffForm.employedSince || null,
    }

    const uploadAvatar = async (staffId) => {
      if (!staffAvatarFile) return null
      const fileExt = staffAvatarFile.name.split('.').pop() || 'jpg'
      const filePath = `staff/${staffId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, staffAvatarFile, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingStaff.id
    if (editingStaff.id) {
      const { error } = await supabase
        .from('staff')
        .update(payload)
        .eq('id', editingStaff.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('staff')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setStaffSaveMessage(saveError.message)
      setStaffSaveLoading(false)
      return
    }

    if (staffAvatarFile && savedId) {
      try {
        const avatarUrl = await uploadAvatar(savedId)
        if (avatarUrl) {
          await supabase
            .from('staff')
            .update({ avatar_url: avatarUrl })
            .eq('id', savedId)
        }
      } catch (error) {
        setStaffSaveMessage(error.message || 'Avatar konnte nicht gespeichert werden.')
        setStaffSaveLoading(false)
        return
      }
    }

    await fetchStaff()
    setStaffSaveLoading(false)
    closeStaffModal()
  }

  const handleSendInvite = async () => {
    if (!staffForm.email.trim()) {
      setStaffInviteMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setStaffInviteLoading(true)
    setStaffInviteMessage('')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: staffForm.email.trim(),
          staffId: editingStaff?.id || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Einladung fehlgeschlagen')
      }
      setStaffInviteMessage('Einladung wurde gesendet!')
    } catch (error) {
      setStaffInviteMessage(error.message)
    }
    setStaffInviteLoading(false)
  }

  useEffect(() => {
    // Check URL for invite or recovery tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const searchParams = new URLSearchParams(window.location.search)
    const type = hashParams.get('type') || searchParams.get('type')
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const isAuthLink = type === 'invite' || type === 'recovery'
    const hasAuthTokens = Boolean(accessToken && refreshToken)

    const initAuth = async () => {
      // If this is an invite or recovery link with tokens
      if (isAuthLink && hasAuthTokens) {
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
          setSession(existingSession)
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        // Set the new session from the tokens in the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error && data.session) {
          setSession(data.session)
          setAuthView('resetPassword')
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }
      }

      // Normal session check (also covers auth links where the session is already set)
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session && isAuthLink) {
        setAuthView('resetPassword')
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('resetPassword')
      }
      if (event === 'SIGNED_IN') {
        const nextHashParams = new URLSearchParams(window.location.hash.substring(1))
        const nextSearchParams = new URLSearchParams(window.location.search)
        const nextType = nextHashParams.get('type') || nextSearchParams.get('type')
        if (nextType === 'invite' || nextType === 'recovery') {
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchPharmacies()
      fetchStaff()
      fetchContacts()
      fetchEmailAccounts()
      fetchEmailPermissions()
      fetchLatestPhoto()
      fetchAllPhotos()
      fetchPhotoOcrData()
      fetchMistralApiKey()
      fetchGoogleApiKey()
    }
  }, [session])

  useEffect(() => {
    if (session && activeView === 'photos' && secondaryTab === 'visitenkarten') {
      fetchBusinessCards()
    }
  }, [session, activeView, secondaryTab])

  useEffect(() => {
    if (session && activeView === 'apo') {
      if (apoTab === 'amk') {
        fetchAmkMessages(apoYear)
      } else if (apoTab === 'recall') {
        fetchRecallMessages(apoYear)
      } else if (apoTab === 'lav') {
        fetchLavAusgaben(apoYear)
      }
    }
  }, [session, activeView, apoTab, apoYear])

  // Unread-Counts und Read-IDs laden
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCounts(apoYear)
      fetchReadMessageIds()
    }
  }, [session?.user?.id, apoYear])

  // PZN-Fotos laden bei Message-Wechsel (nur für Rückrufe)
  useEffect(() => {
    if (selectedApoMessage?.id && selectedApoMessage?.type === 'recall') {
      loadSavedPznFotos(selectedApoMessage.id)
    } else {
      setSavedPznFotos({})
    }
  }, [selectedApoMessage?.id, selectedApoMessage?.type])

  useEffect(() => {
    if (session?.user?.id) {
      const matched = staff.find((member) => member.auth_user_id === session.user.id)
      setCurrentStaff(matched || null)
    }
  }, [staff, session])

  useEffect(() => {
    if (!weatherLocation && pharmacies.length > 0) {
      const primary = pharmacies[0]
      const cityLabel = primary.city ? [primary.postal_code, primary.city].filter(Boolean).join(' ') : ''
      const fallback = cityLabel || primary.name
      if (fallback) {
        setWeatherLocation(fallback)
      }
    }
  }, [pharmacies, weatherLocation])

  useEffect(() => {
    if (weatherLocation) {
      fetchWeather(weatherLocation)
    }
  }, [weatherLocation])

  useEffect(() => {
    if (!session || activeView !== 'chat') return
    fetchChatMessages()
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMessages((prev) => {
          if (prev.some((message) => message.id === payload.new.id)) {
            return prev
          }
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session])

  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeView, chatMessages])

  useEffect(() => {
    if (session && activeView === 'plan' && !planData && !planLoading && !planError) {
      fetchPlanData()
    }
  }, [activeView, session, planData, planLoading, planError])

  // Dashboard Events laden
  useEffect(() => {
    if (session && activeView === 'dashboard' && dashboardEvents.length === 0 && !dashboardEventsLoading) {
      fetchDashboardEvents()
    }
  }, [activeView, session])

  // GH-Rechnungen laden bei View-Wechsel
  useEffect(() => {
    if (session && activeView === 'rechnungen' && rechnungen.length === 0 && !rechnungenLoading) {
      fetchRechnungen()
    }
  }, [activeView, session])

  // Kalender laden bei View-Wechsel
  useEffect(() => {
    if (session && activeView === 'calendar') {
      fetchCalendars()
    }
  }, [session, activeView])

  // Events laden bei Kalender/Datum-Wechsel
  useEffect(() => {
    if (session && activeView === 'calendar' && selectedCalendarId) {
      fetchCalendarEvents(selectedCalendarId)
    }
  }, [selectedCalendarId, calendarViewDate, calendarViewMode])

  // Realtime-Subscription für Kalender-Events
  useEffect(() => {
    if (!session || activeView !== 'calendar' || !selectedCalendarId) return

    // Bei "all" auf alle Events hören, sonst nur auf den ausgewählten Kalender
    const subscriptionConfig = selectedCalendarId === 'all'
      ? { event: '*', schema: 'public', table: 'calendar_events' }
      : { event: '*', schema: 'public', table: 'calendar_events', filter: `calendar_id=eq.${selectedCalendarId}` }

    const channel = supabase
      .channel(`calendar_events_${selectedCalendarId}`)
      .on('postgres_changes', subscriptionConfig, () => {
        fetchCalendarEvents(selectedCalendarId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session, selectedCalendarId])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Passwort erfolgreich geändert!')
      setNewPassword('')
      setConfirmPassword('')
      setAuthView('login')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('')
    setSuccessMessage('')
    setAuthView('login')
    setSecondaryOpen(false)
  }

  // Password reset view (even if logged in via invite link)
  if (authView === 'resetPassword') {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
        <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <img src="/logo.png" alt="Kaeee" className="h-10" />
              <p className={`text-sm ${theme.textMuted}`}>Neues Passwort setzen</p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Passwort speichern"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Dashboard view
  if (session) {
    return (
      <div className={`min-h-screen ${theme.bgApp} ${theme.textPrimary} flex flex-col relative overflow-hidden`}>
        {/* Header */}
        <header className={`bg-white border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className={`lg:hidden p-2 rounded-[6px] ${theme.textSecondary} hover:bg-[#F5F7FA]`}
              title={mobileNavOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {mobileNavOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
            <img src="/logo.png" alt="Kaeee" className="h-8" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Camera button - kontextabhängig */}
            <button
              onClick={() => {
                if (activeView === 'settings' && settingsTab === 'contacts') {
                  businessCardScanRef.current?.click()
                } else {
                  cameraInputRef.current?.click()
                }
              }}
              className={`p-2 rounded-[6px] hover:bg-[#F5F7FA] ${theme.textSecondary} transition-colors ${(photoUploading || businessCardScanning) ? 'opacity-50' : ''}`}
              title={(activeView === 'settings' && settingsTab === 'contacts') ? 'Visitenkarte scannen' : 'Foto aufnehmen'}
              disabled={photoUploading || businessCardScanning}
            >
              {businessCardScanning ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Icons.Camera />
              )}
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            {/* Separater Input für Visitenkarten-Scan (Header) */}
            <input
              ref={businessCardScanRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBusinessCardScan}
              className="hidden"
            />
            {/* Input für PZN-Fotos (Rückrufe) */}
            <input
              ref={pznCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePznCameraCapture}
              className="hidden"
            />

            {/* GH-Rechnungen Button */}
            <button
              onClick={() => setActiveView('rechnungen')}
              className={`p-2 rounded-[6px] hover:bg-[#F5F7FA] ${activeView === 'rechnungen' ? theme.accentText : theme.textSecondary} transition-colors`}
              title="GH-Rechnungen"
            >
              <Icons.FileText />
            </button>

            {/* User email - hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session.user.email}
                  className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  {session.user.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-[6px] ${theme.danger} transition-colors`}
              title="Ausloggen"
            >
              <Icons.Logout />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile nav overlay */}
          {mobileNavOpen && (
            <div
              className={`fixed inset-0 ${theme.overlay} z-40 lg:hidden`}
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Mobile nav drawer */}
          <aside
            className={`
              mobile-nav-drawer
              ${theme.sidebarBg} text-white fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px]
              transform ${mobileNavOpen ? 'translate-x-0 duration-200' : '-translate-x-full duration-700'} transition-transform ease-out
              lg:hidden
            `}
          >
            <div className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-[#3c4255] flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#9CA3AF]">Navigation</p>
                  <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
                    {navItems.find((item) => item.id === activeView)?.label || 'Menü'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#4a5066]"
                  title="Menü schließen"
                >
                  <Icons.X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <nav className="p-2 space-y-1 border-b border-[#3c4255]">
                  {navItems.map((item) => {
                    const totalApoUnread = item.id === 'apo' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav : 0
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                          activeView === item.id ? 'bg-[#4a5066] text-white' : 'text-[#E5E7EB] hover:bg-[#4a5066]'
                        }`}
                        onClick={() => setActiveView(item.id)}
                      >
                        <div className="relative">
                          <item.icon />
                          {totalApoUnread > 0 && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {totalApoUnread > 0 && (
                          <span className="text-xs text-red-400">({totalApoUnread})</span>
                        )}
                      </button>
                    )
                  })}
                </nav>

                <nav className="p-2 space-y-1">
                  {(secondaryNavMap[activeView] || []).map((item) => {
                    const isActive = getActiveSecondaryId() === item.id
                    const badgeCount = activeView === 'apo' ? unreadCounts[item.id] || 0 : 0
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full flex items-center text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                          isActive
                            ? theme.secondaryActive
                            : 'border-transparent text-[#E5E7EB] hover:bg-[#4a5066] hover:text-white'
                        }`}
                        onClick={() => {
                          handleSecondarySelect(item.id)
                          setMobileNavOpen(false)
                        }}
                      >
                        <span>{item.label}</span>
                        <UnreadBadge count={badgeCount} />
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Primary Sidebar */}
          <aside className={`hidden lg:flex flex-shrink-0 ${theme.sidebarBg} w-16 min-w-[4rem] max-w-[4rem] overflow-visible`}>
            <div className="h-full flex flex-col">
              <nav className="py-3 space-y-1 flex flex-col items-center">
                {navItems.map((item) => {
                  const totalApoUnread = item.id === 'apo' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav : 0
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        type="button"
                        className={`w-10 h-10 flex items-center justify-center mx-auto rounded-[6px] border-l-[3px] border-transparent box-border transition-colors ${theme.sidebarText} ${
                          activeView === item.id ? theme.sidebarActive : theme.sidebarHover
                        }`}
                        onClick={() => {
                          setActiveView(item.id)
                        }}
                      >
                        <item.icon />
                        {totalApoUnread > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#3c4255]" />
                        )}
                      </button>
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#1F2937] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}{totalApoUnread > 0 && ` (${totalApoUnread})`}
                      </span>
                    </div>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Secondary Sidebar */}
          <aside
            className={`
              ${theme.secondarySidebarBg} border-r ${theme.border} flex-shrink-0 z-40
              hidden lg:flex lg:relative inset-y-0 left-0 top-0
              w-48
            `}
          >
            <div className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-[#3c4255]">
                <p className="text-xs uppercase tracking-[0.08em] text-[#9CA3AF]">Navigation</p>
                <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
                  {navItems.find((item) => item.id === activeView)?.label || 'Kontext'}
                </h2>
              </div>
              <nav className="p-2 space-y-1 overflow-y-auto">
                {(secondaryNavMap[activeView] || []).map((item) => {
                  const isActive = getActiveSecondaryId() === item.id
                  const badgeCount = activeView === 'apo' ? unreadCounts[item.id] || 0 : 0
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full flex items-center text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                        isActive
                          ? theme.secondaryActive
                          : 'border-transparent text-[#E5E7EB] hover:bg-[#3c4255] hover:text-white'
                      }`}
                      title={item.label}
                      onClick={() => {
                        handleSecondarySelect(item.id)
                      }}
                    >
                      <span>{item.label}</span>
                      <UnreadBadge count={badgeCount} />
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className={activeView === 'chat' || activeView === 'post' ? 'w-full' : 'max-w-5xl'}>
              {activeView === 'dashboard' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Dashboard</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Wetter-Widget */}
                    <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-medium ${theme.text}`}>Wetter</h3>
                        <button
                          type="button"
                          onClick={openWeatherModal}
                          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                          title="Ort einstellen"
                        >
                          <Icons.Settings />
                        </button>
                      </div>

                      {weatherLoading && (
                        <p className={`text-sm ${theme.textMuted}`}>Wetterdaten werden geladen...</p>
                      )}
                      {!weatherLoading && weatherError && (
                        <p className="text-rose-400 text-sm">{weatherError}</p>
                      )}
                      {!weatherLoading && !weatherError && weatherData && (
                        <div className="space-y-4">
                          {/* Kopfbereich: Icon links, Daten rechts */}
                          <div className="flex items-start gap-4">
                            {/* Großes Wetter-Icon */}
                            <div className={`${theme.textSecondary} flex-shrink-0`}>
                              <WeatherIcon code={weatherData.weatherCode} className="w-16 h-16" />
                            </div>
                            {/* Textblock rechts */}
                            <div className="flex-1 min-w-0">
                              <p className="text-4xl font-semibold tracking-tight">
                                {Math.round(weatherData.temperature)}°C
                              </p>
                              <p className={`text-sm font-medium ${theme.primary}`}>
                                {weatherData.name || weatherLocation}
                              </p>
                              <p className={`text-sm ${theme.text}`}>
                                {weatherDescription(weatherData.weatherCode)}
                              </p>
                              <p className={`text-xs ${theme.textMuted}`}>
                                Gefühlt {Math.round(weatherData.feelsLike ?? weatherData.temperature)}°C
                              </p>
                            </div>
                          </div>

                          {/* Min/Max und Niederschlag */}
                          <div className="flex items-center justify-between text-sm">
                            <p className={theme.textSecondary}>
                              Min {Math.round(weatherData.daily?.[0]?.min ?? 0)}°C · Max {Math.round(weatherData.daily?.[0]?.max ?? 0)}°C
                            </p>
                            <div className={`flex items-center gap-1 ${theme.textSecondary}`}>
                              <Icons.Droplet className="w-4 h-4" />
                              <span>{weatherData.daily?.[0]?.precipitationProbability ?? 0}%</span>
                            </div>
                          </div>

                          {/* 3-Tage-Vorschau */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {weatherData.daily?.slice(0, 3).map((day, index) => {
                              const dayLabel = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })
                              return (
                                <div key={day.date} className={`bg-[#F0F2F5] rounded-xl p-3 text-center`}>
                                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{dayLabel}</p>
                                  <div className={`flex justify-center mb-2 ${theme.textSecondary}`}>
                                    <WeatherIcon code={day.weatherCode ?? weatherData.weatherCode} className="w-8 h-8" />
                                  </div>
                                  <p className={`text-base font-semibold ${theme.text}`}>
                                    {Math.round(day.max ?? 0)}°
                                  </p>
                                  <p className={`text-sm ${theme.textMuted}`}>
                                    {Math.round(day.min ?? 0)}°
                                  </p>
                                  <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${theme.textMuted}`}>
                                    <Icons.Droplet className="w-3 h-3" />
                                    <span>{day.precipitationProbability ?? 0}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {!weatherLoading && !weatherError && !weatherData && (
                        <p className={theme.textMuted}>
                          Kein Wetter verfügbar.
                        </p>
                      )}
                    </div>
                    {/* Kalender Widget */}
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-medium ${theme.text}`}>Termine</h3>
                        <button
                          type="button"
                          onClick={() => setActiveView('calendar')}
                          className={`text-xs ${theme.accentText} hover:underline`}
                        >
                          Kalender öffnen
                        </button>
                      </div>
                      {dashboardEventsLoading && (
                        <p className={`text-xs ${theme.textMuted}`}>Termine werden geladen...</p>
                      )}
                      {!dashboardEventsLoading && dashboardEvents.length === 0 && (
                        <p className={theme.textMuted}>Keine kommenden Termine.</p>
                      )}
                      {!dashboardEventsLoading && dashboardEvents.length > 0 && (() => {
                        const today = new Date()
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                        // Wochenende berechnen (Sonntag dieser Woche)
                        const endOfWeek = new Date(today)
                        const daysUntilSunday = 7 - today.getDay()
                        endOfWeek.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday))
                        const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`

                        // Termine filtern
                        const todayEvents = dashboardEvents.filter((e) => e.start_time.substring(0, 10) === todayStr)
                        const weekEvents = dashboardEvents.filter((e) => {
                          const eventDate = e.start_time.substring(0, 10)
                          return eventDate > todayStr && eventDate <= endOfWeekStr && !e.calendarName.toLowerCase().includes('notdienst')
                        })
                        const futureEvents = dashboardEvents.filter((e) => {
                          const eventDate = e.start_time.substring(0, 10)
                          return eventDate > endOfWeekStr && !e.calendarName.toLowerCase().includes('notdienst')
                        }).slice(0, 5)

                        const formatTime = (dateStr) => {
                          return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                        }

                        const formatDate = (dateStr) => {
                          return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
                        }

                        return (
                          <div className="space-y-4 text-sm">
                            {/* Heute */}
                            <div>
                              <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Heute</p>
                              {todayEvents.length === 0 ? (
                                <p className={`text-xs ${theme.textMuted}`}>Keine Termine</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {todayEvents.map((event) => (
                                    <div key={event.id} className="flex items-center gap-2">
                                      <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                                      <span className={`text-xs ${theme.textMuted} w-10`}>
                                        {event.all_day ? 'Ganz.' : formatTime(event.start_time)}
                                      </span>
                                      <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Diese Woche */}
                            {weekEvents.length > 0 && (
                              <div>
                                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Diese Woche</p>
                                <div className="space-y-1.5">
                                  {weekEvents.map((event) => (
                                    <div key={event.id} className="flex items-center gap-2">
                                      <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                                      <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                                      <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Weitere Termine */}
                            {futureEvents.length > 0 && (
                              <div>
                                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Demnächst</p>
                                <div className="space-y-1.5">
                                  {futureEvents.map((event) => (
                                    <div key={event.id} className="flex items-center gap-2">
                                      <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                                      <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                                      <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
                      <h3 className={`text-lg font-medium ${theme.text}`}>Letztes Foto</h3>
                      {photoUploading && (
                        <p className={`text-xs ${theme.textMuted}`}>Foto wird hochgeladen...</p>
                      )}
                      {!photoUploading && latestPhoto && (
                        <div className="space-y-2">
                          <img
                            src={latestPhoto.url}
                            alt="Letztes Foto"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                          <p className={`text-xs ${theme.textMuted}`}>
                            {latestPhoto.createdAt
                              ? new Date(latestPhoto.createdAt).toLocaleString('de-DE')
                              : latestPhoto.name}
                          </p>
                        </div>
                      )}
                      {!photoUploading && !latestPhoto && (
                        <p className={theme.textMuted}>
                          Noch kein Foto vorhanden. Nutze das Kamera-Symbol oben.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeView === 'photos' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">
                    {secondaryTab === 'visitenkarten' ? 'Visitenkarten' : 'Fotos'}
                  </h2>

                  {/* Uploads Tab */}
                  {(secondaryTab === 'uploads' || secondaryTab === 'library' || secondaryTab === 'ocr') && (
                    <>
                      {photosLoading ? (
                        <p className={theme.textMuted}>Fotos werden geladen...</p>
                      ) : allPhotos.length === 0 ? (
                        <p className={theme.textMuted}>Keine Fotos vorhanden. Nutze das Kamera-Symbol oben.</p>
                      ) : (
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                          {allPhotos.map((photo) => (
                            <div
                              key={photo.name}
                              className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#6AA9F0] transition-all relative group`}
                            >
                              <button
                                type="button"
                                onClick={(e) => deletePhoto(photo.name, e)}
                                className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                                title="Foto löschen"
                              >
                                <Icons.X />
                              </button>
                              <button
                                type="button"
                                onClick={() => openPhotoEditor(photo)}
                                className="w-full text-left"
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="w-full h-32 object-cover"
                                />
                                <div className="p-2 space-y-1">
                                  <p className={`text-xs ${theme.textMuted} truncate`}>
                                    {photo.createdAt
                                      ? new Date(photo.createdAt).toLocaleDateString('de-DE')
                                      : photo.name}
                                  </p>
                                  <p className={`text-xs ${theme.textMuted}`}>
                                    {photo.format}{photo.sizeKB ? ` · ${photo.sizeKB} KB` : ''}
                                  </p>
                                  {ocrProcessing[photo.name] && (
                                    <p className={`text-xs ${theme.accentText}`}>OCR läuft...</p>
                                  )}
                                  {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'completed' && (
                                    <p className={`text-xs ${theme.textMuted} line-clamp-2`}>
                                      {photoOcrData[photo.name].text}
                                    </p>
                                  )}
                                  {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'error' && (
                                    <p className="text-xs text-rose-400">OCR fehlgeschlagen</p>
                                  )}
                                  {!ocrProcessing[photo.name] && !photoOcrData[photo.name] && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); runOcrForPhoto(photo.name, photo.url); }}
                                      className={`text-xs ${theme.accentText} hover:underline`}
                                    >
                                      OCR starten
                                    </button>
                                  )}
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Visitenkarten Tab */}
                  {secondaryTab === 'visitenkarten' && (
                    <>
                      {businessCardsLoading ? (
                        <p className={theme.textMuted}>Visitenkarten werden geladen...</p>
                      ) : businessCards.length === 0 ? (
                        <p className={theme.textMuted}>Keine Visitenkarten vorhanden. Importiere Kontakte mit Visitenkarten-Scan.</p>
                      ) : (
                        <>
                          <p className={`text-sm ${theme.textMuted} mb-4`}>{businessCards.length} Visitenkarten</p>
                          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                            {businessCards.map((card) => (
                              <div
                                key={card.id}
                                className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#6AA9F0] transition-all relative group`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => deleteBusinessCard(card, e)}
                                  className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                                  title="Visitenkarte löschen"
                                >
                                  <Icons.X />
                                </button>
                                <a
                                  href={card.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={card.url}
                                    alt={card.contactName}
                                    className="w-full h-32 object-cover"
                                  />
                                  <div className="p-2 space-y-1">
                                    <p className={`text-sm font-medium ${theme.text} truncate`}>
                                      {card.contactName}
                                    </p>
                                    {card.company && (
                                      <p className={`text-xs ${theme.textMuted} truncate`}>
                                        {card.company}
                                      </p>
                                    )}
                                    <p className={`text-xs ${theme.textMuted}`}>
                                      {card.createdAt
                                        ? new Date(card.createdAt).toLocaleDateString('de-DE')
                                        : ''} · {card.format}
                                    </p>
                                  </div>
                                </a>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {activeView === 'apo' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Apo</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeApoYear(-1)}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Vorheriges Jahr"
                      >
                        <Icons.ChevronLeft />
                      </button>
                      <span className={`text-sm font-medium ${theme.text} min-w-[80px] text-center`}>
                        {apoYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeApoYear(1)}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Nächstes Jahr"
                      >
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="relative">
                      <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={apoSearch}
                        onChange={(e) => setApoSearch(e.target.value)}
                        placeholder="Suchen..."
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.input} text-sm`}
                      />
                      {apoSearch && (
                        <button
                          type="button"
                          onClick={() => setApoSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          title="Suche löschen"
                        >
                          <Icons.X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {apoTab === 'amk' && (
                    <div>
                      {amkLoading ? (
                        <p className={theme.textMuted}>AMK-Meldungen werden geladen...</p>
                      ) : amkMessages.length === 0 ? (
                        <p className={theme.textMuted}>Keine AMK-Meldungen in diesem Jahr.</p>
                      ) : filterApoItems(amkMessages, apoSearch, 'amk').length === 0 ? (
                        <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
                      ) : (
                        <div className="space-y-8">
                          {groupByMonth(filterApoItems(amkMessages, apoSearch, 'amk'), 'date').map((group) => (
                            <div key={group.month}>
                              <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {group.items.map((msg) => {
                                  // Nur als ungelesen markieren wenn: nicht gelesen UND nach Nutzer-Erstellung
                                  const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                                  const msgDate = msg.date ? new Date(msg.date) : new Date(0)
                                  const isUnread = !readMessageIds.amk.has(String(msg.id)) && msgDate >= userCreatedAt
                                  return (
                                    <button
                                      key={msg.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedApoMessage({ ...msg, type: 'amk' })
                                        markAsRead('amk', msg.id)
                                        loadDokumentationen(msg.id, 'amk')
                                      }}
                                      className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#6AA9F0] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className={`text-xs ${theme.textMuted}`}>
                                          {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                                        </span>
                                        {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                                      </div>
                                      <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{msg.title}</h3>
                                      <p className={`text-sm ${theme.textMuted} line-clamp-3 flex-grow`}>
                                        {msg.description || msg.full_text?.substring(0, 150) || ''}
                                      </p>
                                      {msg.category && (
                                        <span className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium`}>
                                          {msg.category}
                                        </span>
                                      )}
                                      {/* Bearbeitungsstatus anzeigen - ERSTER Bearbeiter wird angezeigt */}
                                      {msg.dokumentationen && msg.dokumentationen.length > 0 && (() => {
                                        // Älteste Dokumentation (erster Bearbeiter) - Array ist DESC sortiert, also letztes Element
                                        const firstDok = msg.dokumentationen[msg.dokumentationen.length - 1]
                                        const hasSignature = msg.dokumentationen.some(d => d.unterschrift_data)
                                        return (
                                          <div className={`mt-3 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl ${hasSignature ? 'bg-green-50' : 'bg-amber-50'}`}>
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${hasSignature ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                              <span className={`text-xs ${hasSignature ? 'text-green-700' : 'text-amber-700'}`}>
                                                {firstDok.erstellt_von_name || 'Bearbeitet'}
                                                {firstDok.erstellt_am && ` · ${new Date(firstDok.erstellt_am).toLocaleDateString('de-DE')}`}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      })()}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {apoTab === 'recall' && (
                    <div>
                      {recallLoading ? (
                        <p className={theme.textMuted}>Rückrufe werden geladen...</p>
                      ) : recallMessages.length === 0 ? (
                        <p className={theme.textMuted}>Keine Rückrufe in diesem Jahr.</p>
                      ) : filterApoItems(recallMessages, apoSearch, 'recall').length === 0 ? (
                        <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
                      ) : (
                        <div className="space-y-8">
                          {groupByMonth(filterApoItems(recallMessages, apoSearch, 'recall'), 'date').map((group) => (
                            <div key={group.month}>
                              <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {group.items.map((msg) => {
                                  // Nur als ungelesen markieren wenn: nicht gelesen UND nach Nutzer-Erstellung
                                  const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                                  const msgDate = msg.date ? new Date(msg.date) : new Date(0)
                                  const isUnread = !readMessageIds.recall.has(String(msg.id)) && msgDate >= userCreatedAt
                                  return (
                                    <button
                                      key={msg.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedApoMessage({ ...msg, type: 'recall' })
                                        markAsRead('recall', msg.id)
                                        loadDokumentationen(msg.id, 'recall')
                                      }}
                                      className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#6AA9F0] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className={`text-xs ${theme.textMuted}`}>
                                          {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                                        </span>
                                        {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                                      </div>
                                      <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{msg.title}</h3>
                                      {msg.ai_zusammenfassung ? (
                                        <div className={`text-sm ${theme.text} line-clamp-4 flex-grow`}>
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.ai_zusammenfassung}</ReactMarkdown>
                                        </div>
                                      ) : (
                                        <p className={`text-sm ${theme.textMuted} line-clamp-3 flex-grow`}>
                                          {msg.description || msg.full_text?.substring(0, 150) || ''}
                                        </p>
                                      )}
                                      {msg.product_name && (
                                        <span className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-medium`}>
                                          {msg.product_name}
                                        </span>
                                      )}
                                      {msg.dokumentationen && msg.dokumentationen.length > 0 && (() => {
                                        // Älteste Dokumentation (erster Bearbeiter) - Array ist DESC sortiert, also letztes Element
                                        const firstDok = msg.dokumentationen[msg.dokumentationen.length - 1]
                                        const hasSignature = msg.dokumentationen.some(d => d.unterschrift_data)
                                        return (
                                          <div className={`mt-3 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl ${hasSignature ? 'bg-green-50' : 'bg-amber-50'}`}>
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2 h-2 rounded-full ${hasSignature ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                              <span className={`text-xs ${hasSignature ? 'text-green-700' : 'text-amber-700'}`}>
                                                {firstDok.erstellt_von_name || 'Bearbeitet'}
                                                {firstDok.erstellt_am && ` · ${new Date(firstDok.erstellt_am).toLocaleDateString('de-DE')}`}
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      })()}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {apoTab === 'lav' && (
                    <div>
                      {lavLoading ? (
                        <p className={theme.textMuted}>LAK-Infos werden geladen...</p>
                      ) : lavAusgaben.length === 0 ? (
                        <p className={theme.textMuted}>Keine LAK-Infos in diesem Jahr.</p>
                      ) : filterApoItems(lavAusgaben, apoSearch, 'lav').length === 0 ? (
                        <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
                      ) : (
                        <div className="space-y-8">
                          {groupByMonth(filterApoItems(lavAusgaben, apoSearch, 'lav'), 'datum').map((group) => (
                            <div key={group.month}>
                              <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {group.items.map((ausgabe) => {
                                  // Nur als ungelesen markieren wenn: nicht gelesen UND nach Nutzer-Erstellung
                                  const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                                  const msgDate = ausgabe.datum ? new Date(ausgabe.datum) : new Date(0)
                                  const isUnread = !readMessageIds.lav.has(String(ausgabe.id)) && msgDate >= userCreatedAt
                                  return (
                                    <button
                                      key={ausgabe.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedApoMessage({ ...ausgabe, type: 'lav' })
                                        markAsRead('lav', ausgabe.id)
                                      }}
                                      className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#6AA9F0] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className={`text-xs ${theme.textMuted}`}>
                                          {ausgabe.datum ? new Date(ausgabe.datum).toLocaleDateString('de-DE') : ''}
                                        </span>
                                        {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                                      </div>
                                      <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{ausgabe.subject || `LAV-Info ${ausgabe.ausgabe}`}</h3>
                                      <p className={`text-sm ${theme.textMuted} mb-3`}>
                                        Ausgabe {ausgabe.ausgabe} - {ausgabe.lav_themes?.length || 0} Themen
                                      </p>
                                      {ausgabe.lav_themes && ausgabe.lav_themes.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                          {ausgabe.lav_themes.slice(0, 2).map((t) => (
                                            <span key={t.id} className={`text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium`}>
                                              {t.titel?.substring(0, 25) || 'Thema'}{t.titel?.length > 25 ? '...' : ''}
                                            </span>
                                          ))}
                                          {ausgabe.lav_themes.length > 2 && (
                                            <span className={`text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium`}>
                                              +{ausgabe.lav_themes.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeView === 'chat' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Chat</h2>
                  <div className="flex flex-col h-[70vh]">
                    <div className={`flex-1 overflow-auto rounded-2xl border ${theme.border} ${theme.bg} p-4 space-y-4`}>
                      {chatLoading && (
                        <p className={theme.textMuted}>Nachrichten werden geladen...</p>
                      )}
                      {!chatLoading && chatMessages.length === 0 && (
                        <p className={theme.textMuted}>Noch keine Nachrichten. Starte den Chat.</p>
                      )}
                      {chatMessages.map((entry) => {
                        const sender = staffByAuthId[entry.user_id] || {}
                        const senderName = sender.first_name || 'Unbekannt'
                        const timeLabel = entry.created_at
                          ? new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                          : ''
                        const isOwn = entry.user_id === session.user.id
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse text-right' : ''}`}
                          >
                            {sender.avatar_url ? (
                              <img
                                src={sender.avatar_url}
                                alt={senderName}
                                className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
                              />
                            ) : (
                              <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                                {senderName?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="max-w-[75%]">
                              <div className={`text-xs ${theme.textMuted} flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
                                <span>{senderName}</span>
                                {timeLabel && <span>{timeLabel}</span>}
                              </div>
                              <div
                                className={`inline-block mt-2 rounded-2xl px-4 py-2 border ${
                                  isOwn
                                    ? 'bg-[#4A90E2]/15 border-[#4A90E2]/30 text-[#1F2937]'
                                    : `${theme.panel} ${theme.border}`
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {chatError && (
                      <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                        <p className="text-rose-400 text-sm">{chatError}</p>
                      </div>
                    )}

                    <form onSubmit={sendChatMessage} className="mt-4 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder="Nachricht schreiben..."
                        className={`flex-1 px-4 py-3 rounded-xl border ${theme.input} ${theme.inputPlaceholder}`}
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatInput.trim()}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {chatSending ? 'Senden...' : 'Senden'}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {activeView === 'plan' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Plan</h2>
                    <button
                      type="button"
                      onClick={() => { setPlanData(null); setPlanError(''); fetchPlanData(); }}
                      className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                      title="Daten neu laden"
                    >
                      Aktualisieren
                    </button>
                  </div>

                  {planLoading && (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>Plandaten werden geladen...</p>
                    </div>
                  )}

                  {!planLoading && planError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                      <p className="text-rose-400 text-sm">{planError}</p>
                    </div>
                  )}

                  {!planLoading && !planError && planData && (
                    <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
                      {/* Kalender-Matrix links */}
                      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} h-fit`}>
                        <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>Kalender</p>
                        {(() => {
                          const today = new Date()
                          const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

                          // Erstelle 4 Wochen Kalender (28 Tage) ab Montag der aktuellen Woche
                          const currentDay = today.getDay()
                          const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
                          const startDate = new Date(today)
                          startDate.setDate(today.getDate() + mondayOffset)

                          const weeks = []
                          for (let w = 0; w < 4; w++) {
                            const week = []
                            for (let d = 0; d < 7; d++) {
                              const date = new Date(startDate)
                              date.setDate(startDate.getDate() + w * 7 + d)
                              const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              const dayNum = date.getDate()
                              const hasData = planData.days[dateStr]
                              const isSelected = selectedPlanDate === dateStr
                              const isTodayDate = dateStr === todayStr
                              const isWeekend = d >= 5

                              week.push({ date, dateStr, dayNum, hasData, isSelected, isTodayDate, isWeekend })
                            }
                            weeks.push(week)
                          }

                          const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

                          return (
                            <div className="space-y-1">
                              {/* Wochentags-Header */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map((day, idx) => (
                                  <div key={day} className={`text-[10px] text-center ${idx >= 5 ? theme.textMuted : theme.textSecondary}`}>
                                    {day}
                                  </div>
                                ))}
                              </div>
                              {/* Wochen */}
                              {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="grid grid-cols-7 gap-1">
                                  {week.map((day) => (
                                    <button
                                      key={day.dateStr}
                                      type="button"
                                      onClick={() => day.hasData && setSelectedPlanDate(day.dateStr)}
                                      disabled={!day.hasData}
                                      className={`
                                        w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                        ${day.isSelected
                                          ? 'bg-[#4A90E2] text-white'
                                          : day.isTodayDate
                                            ? `border-2 border-[#4A90E2]/50 ${day.hasData ? theme.text : theme.textMuted}`
                                            : day.hasData
                                              ? `${theme.bgHover} ${day.isWeekend ? theme.textMuted : theme.text}`
                                              : `${theme.textMuted} opacity-40 cursor-not-allowed`
                                        }
                                      `}
                                      title={day.dateStr}
                                    >
                                      {day.dayNum}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                        <p className={`text-[10px] mt-3 ${theme.textMuted}`}>
                          Quelle: {planData.usedFile}
                        </p>
                      </div>

                      {/* Tagesansicht rechts - Timeline */}
                      <div className="space-y-4 min-w-0">
                        {(() => {
                          const dayData = planData.days[selectedPlanDate]
                          const today = new Date()
                          const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          const isToday = selectedPlanDate === todayStr

                          // Zeitachse: 6:00 - 20:00 (14 Stunden)
                          const START_HOUR = 6
                          const END_HOUR = 20
                          const TOTAL_HOURS = END_HOUR - START_HOUR
                          const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

                          const parseTime = (timeStr) => {
                            if (!timeStr) return null
                            const [h, m] = timeStr.split(':').map(Number)
                            return h + m / 60
                          }

                          const getBarStyle = (start, end) => {
                            // Behandle Nachtschichten
                            let displayStart = start
                            let displayEnd = end

                            // Wenn Ende 0:00 (Mitternacht) oder kleiner als Start -> bis 20:00 anzeigen
                            if (end <= start && end < START_HOUR) {
                              displayEnd = END_HOUR
                            }

                            // Wenn Start vor 6:00 -> ab 6:00 anzeigen
                            if (displayStart < START_HOUR) {
                              displayStart = START_HOUR
                            }

                            // Wenn Ende nach 20:00 -> bis 20:00 anzeigen
                            if (displayEnd > END_HOUR) {
                              displayEnd = END_HOUR
                            }

                            // Clamp to visible range
                            displayStart = Math.max(START_HOUR, Math.min(END_HOUR, displayStart))
                            displayEnd = Math.max(START_HOUR, Math.min(END_HOUR, displayEnd))

                            const left = ((displayStart - START_HOUR) / TOTAL_HOURS) * 100
                            const width = ((displayEnd - displayStart) / TOTAL_HOURS) * 100

                            return { left: `${left}%`, width: `${Math.max(0, width)}%` }
                          }

                          if (!dayData) {
                            return (
                              <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                                <p className={theme.textMuted}>Keine Daten für {selectedPlanDate} verfügbar.</p>
                              </div>
                            )
                          }

                          return (
                            <div className={`${theme.panel} rounded-2xl p-5 border ${isToday ? 'border-[#4A90E2]/40' : theme.border} ${theme.cardShadow}`}>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold">{dayData.issueDate}</h3>
                                {isToday && (
                                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#4A90E2]/15 text-[#4A90E2] border border-[#4A90E2]/20">
                                    Heute
                                  </span>
                                )}
                              </div>

                              {Object.entries(dayData.groups).map(([groupName, employees]) => (
                                <div key={groupName} className="mb-6 last:mb-0">
                                  <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>{groupName}</p>

                                  {/* Zeitachse */}
                                  <div className="relative mb-2">
                                    <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                                      {hours.map((h) => (
                                        <span key={h} className="w-0 text-center" style={{ marginLeft: h === START_HOUR ? 0 : undefined }}>
                                          {h}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Mitarbeiter-Balken */}
                                  <div className="space-y-1.5">
                                    {employees.map((emp, idx) => {
                                      const startTime = parseTime(emp.workStart)
                                      const endTime = parseTime(emp.workStop)
                                      const hasWork = startTime !== null && endTime !== null && emp.workStart !== emp.workStop
                                      const isAbsent = emp.status === 'Urlaub' || emp.status === 'Krank'
                                      const isFree = !hasWork && !isAbsent

                                      // Finde Pausen aus timeblocks
                                      const breakBlock = emp.timeblocks.find((tb) => tb.type === 'break')
                                      const breakDuration = breakBlock ? breakBlock.duration : 0

                                      // Berechne Pausenposition (nach dem ersten Arbeitsblock)
                                      let breakStart = null
                                      let breakEnd = null
                                      if (breakDuration > 0 && hasWork) {
                                        let accumulated = 0
                                        for (const tb of emp.timeblocks) {
                                          if (tb.type === 'empty') {
                                            accumulated += tb.duration
                                          } else if (tb.type === 'work') {
                                            accumulated += tb.duration
                                          } else if (tb.type === 'break') {
                                            breakStart = START_HOUR + accumulated / 60
                                            breakEnd = breakStart + tb.duration / 60
                                            break
                                          }
                                        }
                                      }

                                      return (
                                        <div
                                          key={`${emp.firstName}-${emp.lastName}-${idx}`}
                                          className="relative h-7 rounded bg-[#E5E7EB]/70"
                                        >
                                          {/* Hintergrund-Raster */}
                                          <div className="absolute inset-0 flex">
                                            {hours.slice(0, -1).map((h) => (
                                              <div key={h} className="flex-1 border-r border-[#E5E7EB]" />
                                            ))}
                                          </div>

                                          {/* Arbeitsbalken */}
                                          {hasWork && !isAbsent && (
                                            <>
                                              <div
                                                className="absolute top-0.5 bottom-0.5 bg-[#4A90E2] rounded"
                                                style={getBarStyle(startTime, endTime)}
                                              />
                                              {/* Pause */}
                                              {breakStart && breakEnd && (
                                                <div
                                                  className="absolute top-0.5 bottom-0.5 bg-rose-500 rounded"
                                                  style={getBarStyle(breakStart, breakEnd)}
                                                />
                                              )}
                                              {/* Name über allem */}
                                              <div
                                                className="absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-hidden pointer-events-none"
                                                style={getBarStyle(startTime, endTime)}
                                              >
                                                <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                  {emp.firstName} {emp.lastName}
                                                </span>
                                              </div>
                                            </>
                                          )}

                                          {/* Urlaub */}
                                          {emp.status === 'Urlaub' && (
                                            <div
                                              className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                              style={{ left: '0%', width: '100%', backgroundColor: '#A481A2' }}
                                            >
                                              <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                {emp.firstName} {emp.lastName} - Urlaub
                                              </span>
                                            </div>
                                          )}

                                          {/* Krank */}
                                          {emp.status === 'Krank' && (
                                            <div
                                              className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                              style={{ left: '0%', width: '100%', backgroundColor: '#FBBF24' }}
                                            >
                                              <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                {emp.firstName} {emp.lastName} - Krank
                                              </span>
                                            </div>
                                          )}

                                          {/* Frei */}
                                          {isFree && (
                                            <div className="absolute inset-0 flex items-center px-2">
                                              <span className={`text-[11px] ${theme.textMuted} truncate`}>
                                                {emp.firstName} {emp.lastName}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}

                              {/* Legende */}
                              <div className={`flex flex-wrap gap-4 mt-4 pt-4 border-t ${theme.border} text-[10px] ${theme.textMuted}`}>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded bg-[#4A90E2]" />
                                  <span>Arbeit</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded bg-rose-500" />
                                  <span>Pause</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#A481A2' }} />
                                  <span>Urlaub</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FBBF24' }} />
                                  <span>Krank</span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}

                  {!planLoading && !planError && !planData && (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>Keine Plandaten verfügbar.</p>
                    </div>
                  )}
                </>
              )}

              {activeView === 'calendar' && (
                <>
                  {/* Header mit Kalender-Auswahl und Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Kalender</h2>

                      {calendars.length > 0 && (
                        <select
                          value={selectedCalendarId || ''}
                          onChange={(e) => setSelectedCalendarId(e.target.value)}
                          className={`px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                        >
                          <option value="all">Alle Kalender</option>
                          {calendars.map((cal) => (
                            <option key={cal.id} value={cal.id}>
                              {cal.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Ansicht-Wechsler */}
                      <div className={`flex rounded-lg border ${theme.border} overflow-hidden`}>
                        {['month', 'week', 'day'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setCalendarViewMode(mode)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                              calendarViewMode === mode
                                ? 'bg-[#4A90E2] text-white'
                                : `${theme.panel} ${theme.textMuted} ${theme.bgHover}`
                            }`}
                          >
                            {mode === 'month' ? 'Monat' : mode === 'week' ? 'Woche' : 'Tag'}
                          </button>
                        ))}
                      </div>

                      {/* Navigation */}
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarViewDate)
                          if (calendarViewMode === 'month') d.setMonth(d.getMonth() - 1)
                          else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7)
                          else d.setDate(d.getDate() - 1)
                          setCalendarViewDate(d)
                        }}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Zurück"
                      >
                        <Icons.ChevronLeft />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalendarViewDate(new Date())}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                      >
                        Heute
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarViewDate)
                          if (calendarViewMode === 'month') d.setMonth(d.getMonth() + 1)
                          else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7)
                          else d.setDate(d.getDate() + 1)
                          setCalendarViewDate(d)
                        }}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Vor"
                      >
                        <Icons.ChevronRight />
                      </button>

                      {/* Admin-Aktionen */}
                      {currentStaff?.is_admin && (
                        <>
                          <button
                            type="button"
                            onClick={() => openCalendarModal()}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.accent} text-white`}
                          >
                            + Kalender
                          </button>
                          {selectedCalendarId && selectedCalendarId !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPermissionsModalOpen(true)
                                fetchCalendarPermissions(selectedCalendarId)
                              }}
                              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                              title="Berechtigungen verwalten"
                            >
                              <Icons.Settings />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aktueller Monat/Woche Anzeige */}
                  <div className="mb-4">
                    <h3 className={`text-lg font-medium ${theme.text}`}>
                      {calendarViewDate.toLocaleDateString('de-DE', {
                        month: 'long',
                        year: 'numeric',
                        ...(calendarViewMode === 'day' && { day: 'numeric', weekday: 'long' }),
                      })}
                    </h3>
                  </div>

                  {calendarsLoading || eventsLoading ? (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>{calendarsLoading ? 'Kalender werden geladen...' : 'Termine werden geladen...'}</p>
                    </div>
                  ) : calendarsError ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                      <p className="text-rose-400 text-sm">{calendarsError}</p>
                    </div>
                  ) : calendars.length === 0 ? (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>
                        Keine Kalender verfügbar.
                        {currentStaff?.is_admin && ' Erstelle einen neuen Kalender.'}
                      </p>
                    </div>
                  ) : (
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow}`}>
                      {/* Monatsansicht */}
                      {calendarViewMode === 'month' && (() => {
                        const today = new Date()
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                        const firstDay = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1)
                        const startOffset = (firstDay.getDay() + 6) % 7
                        const startDate = new Date(firstDay)
                        startDate.setDate(startDate.getDate() - startOffset)

                        const weeks = []
                        const currentDate = new Date(startDate)

                        for (let w = 0; w < 6; w++) {
                          const week = []
                          for (let d = 0; d < 7; d++) {
                            const dayDate = new Date(currentDate)
                            // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                            const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
                            const isCurrentMonth = dayDate.getMonth() === calendarViewDate.getMonth()
                            const isToday = dateStr === todayStr
                            const isWeekend = d >= 5

                            const dayEvents = calendarEvents.filter((e) => {
                              // Datum direkt aus String extrahieren (vermeidet Zeitzonenprobleme)
                              const eventDate = e.start_time.substring(0, 10)
                              return eventDate === dateStr
                            })

                            week.push({ date: dayDate, dateStr, isCurrentMonth, isToday, events: dayEvents, isWeekend })
                            currentDate.setDate(currentDate.getDate() + 1)
                          }
                          weeks.push(week)
                        }

                        const weekDays = showWeekends ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr']
                        const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5'

                        return (
                          <div className="space-y-1 relative">
                            {/* Toggle Button für Wochenende */}
                            <button
                              type="button"
                              onClick={() => setShowWeekends(!showWeekends)}
                              className={`absolute -right-1 top-0 p-1.5 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                              title={showWeekends ? 'Wochenende ausblenden' : 'Wochenende einblenden'}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {showWeekends ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                )}
                              </svg>
                            </button>

                            <div className={`grid ${gridCols} gap-1 mb-2`}>
                              {weekDays.map((day, idx) => (
                                <div
                                  key={day}
                                  className={`text-xs font-medium text-center py-2 ${showWeekends && idx >= 5 ? theme.textMuted : theme.textSecondary}`}
                                >
                                  {day}
                                </div>
                              ))}
                            </div>

                            {weeks.map((week, wIdx) => (
                              <div key={wIdx} className={`grid ${gridCols} gap-1`}>
                                {week.filter((day) => showWeekends || !day.isWeekend).map((day) => (
                                  <div
                                    key={day.dateStr}
                                    onClick={() => canWriteCurrentCalendar() && openEventModal(null, day.date)}
                                    className={`
                                      min-h-24 p-1 rounded-lg border transition-colors
                                      ${day.isCurrentMonth ? theme.panel : `${theme.panel} opacity-40`}
                                      ${day.isToday ? 'border-[#4A90E2]/50' : theme.border}
                                      ${canWriteCurrentCalendar() ? 'cursor-pointer ' + theme.bgHover : ''}
                                    `}
                                  >
                                    <div
                                      className={`text-xs font-medium mb-1 ${
                                        day.isToday ? theme.accentText : day.isCurrentMonth ? theme.text : theme.textMuted
                                      }`}
                                    >
                                      {day.date.getDate()}
                                    </div>

                                    <div className="space-y-0.5">
                                      {day.events.slice(0, 3).map((event) => (
                                        <div
                                          key={event.id}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openEventModal(event)
                                          }}
                                          className="text-[10px] px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80"
                                          style={{ backgroundColor: getEventColor(event) }}
                                          title={event.title}
                                        >
                                          {!event.all_day && (
                                            <span className="opacity-75 mr-1">
                                              {new Date(event.start_time).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          )}
                                          {event.title}
                                        </div>
                                      ))}
                                      {day.events.length > 3 && (
                                        <div className={`text-[10px] ${theme.textMuted}`}>+{day.events.length - 3} weitere</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Wochenansicht */}
                      {calendarViewMode === 'week' && (() => {
                        const today = new Date()
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                        const startOfWeek = new Date(calendarViewDate)
                        startOfWeek.setDate(calendarViewDate.getDate() - ((calendarViewDate.getDay() + 6) % 7))

                        const days = []
                        for (let i = 0; i < 7; i++) {
                          const d = new Date(startOfWeek)
                          d.setDate(startOfWeek.getDate() + i)
                          // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                          const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)
                          days.push({ date: d, dateStr, isToday: dateStr === todayStr, events: dayEvents })
                        }

                        const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
                        const weekendDays = ['Sa', 'So']
                        const workDays = days.slice(0, 5) // Mo-Fr
                        const weekend = days.slice(5, 7) // Sa-So
                        const weekendEvents = [...weekend[0].events, ...weekend[1].events]

                        return (
                          <div className="space-y-3">
                            {/* Wochenend-Termine kompakt über dem Kalender */}
                            {weekendEvents.length > 0 && (
                              <div className={`p-3 rounded-xl border ${theme.border} ${theme.panel}`}>
                                <div className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>
                                  Wochenende ({weekend[0].date.getDate()}.–{weekend[1].date.getDate()}.)
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {weekend.map((day, idx) => (
                                    day.events.map((event) => (
                                      <div
                                        key={event.id}
                                        onClick={() => openEventModal(event)}
                                        className="text-[11px] px-2 py-1 rounded-lg text-white cursor-pointer hover:opacity-80 flex items-center gap-1.5"
                                        style={{ backgroundColor: getEventColor(event) }}
                                      >
                                        <span className="opacity-75 font-medium">{weekendDays[idx]}</span>
                                        {!event.all_day && (
                                          <span className="opacity-75">
                                            {new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        )}
                                        <span className="truncate max-w-32">{event.title}</span>
                                      </div>
                                    ))
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Mo-Fr Kalender */}
                            <div className="grid grid-cols-5 gap-2">
                              {workDays.map((day, idx) => (
                                <div
                                  key={day.dateStr}
                                  className={`min-h-48 p-2 rounded-lg border ${day.isToday ? 'border-[#4A90E2]/50' : theme.border} ${theme.panel}`}
                                >
                                  <div className={`text-xs font-medium mb-2 ${day.isToday ? theme.accentText : theme.textSecondary}`}>
                                    {weekDays[idx]} {day.date.getDate()}
                                  </div>
                                  <div className="space-y-1">
                                    {day.events.map((event) => (
                                      <div
                                        key={event.id}
                                        onClick={() => openEventModal(event)}
                                        className="text-[10px] px-1.5 py-1 rounded text-white cursor-pointer hover:opacity-80"
                                        style={{ backgroundColor: getEventColor(event) }}
                                      >
                                        {!event.all_day && (
                                          <div className="opacity-75">
                                            {new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        )}
                                        <div className="truncate">{event.title}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {canWriteCurrentCalendar() && (
                                    <button
                                      type="button"
                                      onClick={() => openEventModal(null, day.date)}
                                      className={`mt-2 w-full text-[10px] py-1 rounded ${theme.bgHover} ${theme.textMuted}`}
                                    >
                                      + Termin
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Tagesansicht */}
                      {calendarViewMode === 'day' && (() => {
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const dateStr = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(calendarViewDate.getDate()).padStart(2, '0')}`
                        const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)

                        return (
                          <div className="space-y-2">
                            {dayEvents.length === 0 ? (
                              <p className={theme.textMuted}>Keine Termine an diesem Tag.</p>
                            ) : (
                              dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => openEventModal(event)}
                                  className={`p-3 rounded-xl border ${theme.border} cursor-pointer ${theme.bgHover}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-1 h-12 rounded" style={{ backgroundColor: getEventColor(event) }} />
                                    <div>
                                      <p className={`font-medium ${theme.text}`}>{event.title}</p>
                                      <p className={`text-xs ${theme.textMuted}`}>
                                        {event.all_day
                                          ? 'Ganztägig'
                                          : `${new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                                      </p>
                                      {event.location && <p className={`text-xs ${theme.textMuted}`}>{event.location}</p>}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                            {canWriteCurrentCalendar() && (
                              <button
                                type="button"
                                onClick={() => openEventModal(null, calendarViewDate)}
                                className={`w-full py-2 rounded-xl border ${theme.border} ${theme.bgHover} ${theme.textMuted} text-sm`}
                              >
                                + Neuer Termin
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Floating Add Button */}
                  {canWriteCurrentCalendar() && calendars.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openEventModal()}
                      className={`fixed bottom-6 right-6 p-4 rounded-full ${theme.accent} text-white shadow-lg hover:scale-105 transition-transform z-30`}
                      title="Neuer Termin"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {activeView === 'rechnungen' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Großhandelsrechnungen</h2>

                  {rechnungenLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="w-8 h-8 animate-spin text-[#4A90E2]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : rechnungen.length === 0 ? (
                    <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow} text-center`}>
                      <Icons.FileText className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
                      <p className={theme.textMuted}>Keine Rechnungen vorhanden.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        // Nach Datum gruppieren
                        const byDate = rechnungen.reduce((acc, r) => {
                          const dateKey = r.datum
                          if (!acc[dateKey]) acc[dateKey] = []
                          acc[dateKey].push(r)
                          return acc
                        }, {})

                        // Sortierte Datumsschlüssel (neueste zuerst)
                        const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

                        return sortedDates.map((dateKey, index) => {
                          const dayRechnungen = byDate[dateKey]
                          const phoenix = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'phoenix')
                          const ahd = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'ahd')
                          const sanacorp = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'sanacorp')

                          const dateLabel = new Date(dateKey).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })

                          // Erster Tag (neueste) ist ausgeklappt, alle anderen eingeklappt
                          const isCollapsed = index === 0
                            ? collapsedDays[dateKey] === true
                            : collapsedDays[dateKey] !== false

                          const toggleDay = () => {
                            setCollapsedDays(prev => ({
                              ...prev,
                              [dateKey]: !isCollapsed
                            }))
                          }

                          return (
                            <div key={dateKey}>
                              {/* Tagesüberschrift - klickbar */}
                              <button
                                onClick={toggleDay}
                                className={`w-full flex items-center gap-3 mb-3 group cursor-pointer`}
                              >
                                <svg
                                  className={`w-4 h-4 ${theme.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <h3 className="text-base font-semibold">{dateLabel}</h3>
                                <span className={`text-xs ${theme.textMuted}`}>({dayRechnungen.length})</span>
                                <div className={`flex-1 h-px ${theme.border} border-t`} />
                              </button>

                              {/* Drei Spalten für den Tag - nur wenn ausgeklappt */}
                              {!isCollapsed && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Phoenix - grün */}
                                <div className="space-y-1">
                                  {phoenix.length > 0 ? phoenix.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#E8F5E9] hover:bg-[#C8E6C9] transition-colors border-l-4 border-[#2E7D32]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#1B5E20]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#2E7D32]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>

                                {/* AHD - gelb */}
                                <div className="space-y-1">
                                  {ahd.length > 0 ? ahd.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#FFF8E1] hover:bg-[#FFECB3] transition-colors border-l-4 border-[#F9A825]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#F57F17]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#F9A825]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>

                                {/* Sanacorp - blau */}
                                <div className="space-y-1">
                                  {sanacorp.length > 0 ? sanacorp.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#E3F2FD] hover:bg-[#BBDEFB] transition-colors border-l-4 border-[#1565C0]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#0D47A1]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#1565C0]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>
                              </div>}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </>
              )}

              {activeView === 'post' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">
                    {secondaryTab === 'email' ? 'Email' : 'Fax'}
                  </h2>

                  {secondaryTab === 'email' && (
                    <EmailView
                      theme={theme}
                      account={emailAccounts.find(a => a.id === selectedEmailAccount)}
                      hasAccess={currentUserEmailAccess}
                      onConfigureClick={() => {
                        setActiveView('settings')
                        setSettingsTab('email')
                      }}
                    />
                  )}

                  {secondaryTab === 'fax' && (
                    <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className={`${theme.textMuted} mb-6`}>
                          <Printer size={80} weight="light" />
                        </div>
                        <p className={`text-lg ${theme.textMuted}`}>Fax-Bereich (in Entwicklung)</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeView === 'settings' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Einstellungen</h2>

                  <div className="space-y-4">
                    {settingsTab === 'pharmacies' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold">Apothekendaten</h3>
                            <p className={`text-xs ${theme.textMuted}`}>Maximal 4 Einträge.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={fetchPharmacies}
                              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                              title="Liste aktualisieren"
                            >
                              Aktualisieren
                            </button>
                            <button
                              type="button"
                              onClick={openCreateModal}
                              disabled={pharmacies.length >= 4}
                              className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Apotheke hinzufügen"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {pharmaciesMessage && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                            <p className="text-rose-400 text-sm">{pharmaciesMessage}</p>
                          </div>
                        )}

                        {pharmaciesLoading && (
                          <p className={theme.textMuted}>Lade Daten...</p>
                        )}

                        {!pharmaciesLoading && pharmacies.length === 0 && (
                          <p className={theme.textMuted}>
                            Noch keine Apotheke gespeichert. Nutze das + oben rechts.
                          </p>
                        )}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {pharmacies.map((pharmacy) => (
                            <button
                              type="button"
                              key={pharmacy.id}
                              className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                              title="Apotheke bearbeiten"
                              onClick={() => openEditModal(pharmacy)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{pharmacy.name}</p>
                                  <p className={`text-xs ${theme.textMuted}`}>
                                    {[pharmacy.street, [pharmacy.postal_code, pharmacy.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Telefon: <span className={theme.text}>{pharmacy.phone || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    {pharmacy.owner_role === 'manager' ? 'Filialleiter' : 'Inhaber'}:{' '}
                                    <span className={theme.text}>{pharmacy.owner || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Webseite: <span className={theme.text}>{pharmacy.website || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    E-Mail: <span className={theme.text}>{pharmacy.email || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Fax: <span className={theme.text}>{pharmacy.fax || '-'}</span>
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {settingsTab === 'staff' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold">Kollegium</h3>
                              <p className={`text-xs ${theme.textMuted}`}>Global über alle Apotheken.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={fetchStaff}
                                className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                                title="Liste aktualisieren"
                              >
                                Aktualisieren
                              </button>
                              <button
                                type="button"
                                onClick={() => openStaffModal()}
                                disabled={pharmacies.length === 0}
                                className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                                title="Person hinzufügen"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {staffMessage && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                              <p className="text-rose-400 text-sm">{staffMessage}</p>
                            </div>
                          )}

                          {staffLoading && (
                            <p className={theme.textMuted}>Lade Daten...</p>
                          )}

                          {!staffLoading && pharmacies.length === 0 && (
                            <p className={theme.textMuted}>
                              Bitte zuerst eine Apotheke anlegen, um Kollegium zuzuordnen.
                            </p>
                          )}

                          {!staffLoading && pharmacies.length > 0 && staff.length === 0 && (
                            <p className={theme.textMuted}>
                              Noch keine Personen erfasst. Nutze das + oben rechts.
                            </p>
                          )}

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {staff.map((member) => (
                              <button
                                type="button"
                                key={member.id}
                                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                                title="Person bearbeiten"
                                onClick={() => openStaffModal(member)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {member.avatar_url ? (
                                        <img
                                          src={member.avatar_url}
                                          alt={`${member.first_name} ${member.last_name}`}
                                          className={`h-8 w-8 rounded-full object-cover border ${theme.border}`}
                                        />
                                      ) : (
                                        <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                                          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">
                                          {member.first_name} {member.last_name}
                                        </p>
                                        <p className={`text-xs ${theme.textMuted}`}>
                                          {member.role || '-'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {member.is_admin && (
                                    <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Apotheke: <span className={theme.text}>{pharmacyLookup[member.pharmacy_id] || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Adresse: <span className={theme.text}>
                                      {[member.street, [member.postal_code, member.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Mobil: <span className={theme.text}>{member.mobile || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    E-Mail: <span className={theme.text}>{member.email || '-'}</span>
                                  </p>
                                  {member.auth_user_id && (
                                    <p className={theme.textMuted}>
                                      Login verknüpft
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                    )}

                    {settingsTab === 'email' && (
                      <div className="space-y-4">
                        {/* E-Mail-Konten (nur Admins können bearbeiten) */}
                        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold">E-Mail-Konten</h3>
                              <p className={`text-xs ${theme.textMuted}`}>JMAP-Verbindung zu Stalwart Mail Server.</p>
                            </div>
                            {currentStaff?.is_admin && (
                              <button
                                type="button"
                                onClick={() => openEmailAccountModal()}
                                className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text}`}
                                title="E-Mail-Konto hinzufügen"
                              >
                                +
                              </button>
                            )}
                          </div>

                          {emailAccounts.length === 0 ? (
                            <div className={`text-center py-8 ${theme.textMuted}`}>
                              <EnvelopeSimple size={48} className="mx-auto mb-3 opacity-50" />
                              <p className="text-sm">Noch kein E-Mail-Konto eingerichtet.</p>
                              {currentStaff?.is_admin && (
                                <p className="text-xs mt-1">Klicke auf + um ein Konto hinzuzufügen.</p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {emailAccounts.map((account) => (
                                <div
                                  key={account.id}
                                  className={`flex items-center gap-3 p-3 rounded-xl border ${theme.border} ${
                                    selectedEmailAccount === account.id ? theme.navActive : ''
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectEmailAccount(account.id)}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      selectedEmailAccount === account.id
                                        ? 'border-[#4A90E2] bg-[#4A90E2]'
                                        : `${theme.border}`
                                    }`}
                                    title="Als Standard auswählen"
                                  >
                                    {selectedEmailAccount === account.id && (
                                      <span className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{account.name}</p>
                                    <p className={`text-xs ${theme.textMuted} truncate`}>{account.email}</p>
                                  </div>
                                  {currentStaff?.is_admin && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => openEmailAccountModal(account)}
                                        className={`p-1.5 rounded-lg ${theme.bgHover}`}
                                        title="Bearbeiten"
                                      >
                                        <GearSix size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEmailAccount(account.id)}
                                        className={`p-1.5 rounded-lg ${theme.danger}`}
                                        title="Löschen"
                                      >
                                        <Icons.X />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* E-Mail-Berechtigungen (nur für Admins sichtbar) */}
                        {currentStaff?.is_admin && (
                          <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                            <div className="mb-3">
                              <h3 className="text-base font-semibold">E-Mail-Berechtigungen</h3>
                              <p className={`text-xs ${theme.textMuted}`}>Lege fest, welche Mitarbeiter E-Mails sehen dürfen.</p>
                            </div>

                            {staff.filter(s => s.auth_user_id).length === 0 ? (
                              <div className={`text-center py-6 ${theme.textMuted}`}>
                                <p className="text-sm">Keine Mitarbeiter mit Benutzerkonten gefunden.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {staff.filter(s => s.auth_user_id).map((member) => {
                                  const permission = emailPermissions.find(p => p.user_id === member.auth_user_id)
                                  const hasAccess = permission?.has_access || false
                                  return (
                                    <div
                                      key={member.id}
                                      className={`flex items-center gap-3 p-3 rounded-xl border ${theme.border}`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => toggleEmailPermission(member.auth_user_id, hasAccess)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                          hasAccess
                                            ? 'border-[#4A90E2] bg-[#4A90E2]'
                                            : `${theme.border} hover:border-[#4A90E2]`
                                        }`}
                                        title={hasAccess ? 'Zugriff entziehen' : 'Zugriff gewähren'}
                                      >
                                        {hasAccess && (
                                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {member.first_name} {member.last_name}
                                          {member.is_admin && (
                                            <span className={`ml-2 text-xs ${theme.textMuted}`}>(Admin)</span>
                                          )}
                                        </p>
                                        <p className={`text-xs ${theme.textMuted} truncate`}>{member.email}</p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {settingsTab === 'card-enhance' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div>
                            <h3 className="text-base font-semibold">Visitenkarten-Enhance (Test)</h3>
                            <p className={`text-xs ${theme.textMuted}`}>Google Nano Banana Pro: zuschneiden + Lesbarkeit verbessern.</p>
                          </div>
                          <button
                            type="button"
                            onClick={fetchGoogleApiKey}
                            className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                            title="Google API Key aus DB laden"
                          >
                            Key laden
                          </button>
                        </div>

                        {enhanceMessage && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                            <p className="text-rose-400 text-sm">{enhanceMessage}</p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEnhanceFileChange}
                            className={`flex-1 text-sm ${theme.input} ${theme.inputPlaceholder} border rounded-xl px-3 py-2`}
                          />
                          <button
                            type="button"
                            onClick={runBusinessCardEnhance}
                            disabled={!enhanceFile || enhanceLoading}
                            className={`h-10 px-4 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {enhanceLoading ? 'Verbessere...' : 'Verbessern'}
                          </button>
                        </div>

                        {enhanceLoading && (
                          <div className={`mb-4 flex items-center gap-2 text-xs ${theme.textMuted}`}>
                            <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                            Nano Banana Pro arbeitet im Hintergrund...
                          </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className={`rounded-xl border ${theme.border} p-3`}>
                            <p className={`text-xs ${theme.textMuted} mb-2`}>Vorher</p>
                            {enhancePreview ? (
                              <img
                                src={enhancePreview}
                                alt="Original"
                                className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                              />
                            ) : (
                              <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                                Kein Bild ausgewahlt
                              </div>
                            )}
                          </div>
                          <div className={`rounded-xl border ${theme.border} p-3`}>
                            <p className={`text-xs ${theme.textMuted} mb-2`}>Nachher</p>
                            {enhanceResultPreview ? (
                              <img
                                src={enhanceResultPreview}
                                alt="Verbessert"
                                className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                              />
                            ) : (
                              <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                                Noch kein Ergebnis
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === 'contacts' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold">Kontakte</h3>
                            <p className={`text-xs ${theme.textMuted}`}>Business-Kontakte und Visitenkarten.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={fetchContacts}
                              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                              title="Liste aktualisieren"
                            >
                              Aktualisieren
                            </button>
                            <button
                              type="button"
                              onClick={() => openContactModal()}
                              disabled={!currentStaff}
                              className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Kontakt hinzufügen"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Suchfeld und Ansicht-Umschalter */}
                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={contactSearch}
                              onChange={(e) => setContactSearch(e.target.value)}
                              placeholder="Suchen nach Name, Firma, Adresse, E-Mail..."
                              className={`w-full pl-10 pr-10 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                            />
                            {contactSearch && (
                              <button
                                type="button"
                                onClick={() => setContactSearch('')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.text}`}
                                title="Suche löschen"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {/* Ansicht-Umschalter */}
                          <div className={`flex rounded-xl border ${theme.border} overflow-hidden`}>
                            <button
                              type="button"
                              onClick={() => setContactViewMode('cards')}
                              className={`px-3 py-2 ${contactViewMode === 'cards' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                              title="Kartenansicht"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setContactViewMode('list')}
                              className={`px-3 py-2 ${contactViewMode === 'list' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                              title="Listenansicht"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {contactSearch && (
                          <p className={`text-xs ${theme.textMuted} mb-3`}>
                            {filteredContacts.length} von {contacts.length} Kontakten
                          </p>
                        )}

                        {contactsMessage && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                            <p className="text-rose-400 text-sm">{contactsMessage}</p>
                          </div>
                        )}

                        {contactsLoading && (
                          <p className={theme.textMuted}>Lade Daten...</p>
                        )}

                        {!contactsLoading && !currentStaff && (
                          <p className={theme.textMuted}>
                            Bitte zuerst ein Mitarbeiter-Profil anlegen.
                          </p>
                        )}

                        {!contactsLoading && currentStaff && contacts.length === 0 && (
                          <p className={theme.textMuted}>
                            Noch keine Kontakte erfasst. Nutze das + oben rechts.
                          </p>
                        )}

                        {!contactsLoading && currentStaff && contacts.length > 0 && filteredContacts.length === 0 && (
                          <p className={theme.textMuted}>
                            Keine Kontakte gefunden für "{contactSearch}".
                          </p>
                        )}

                        {/* Kartenansicht */}
                        {contactViewMode === 'cards' && (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {filteredContacts.map((contact) => (
                              <button
                                type="button"
                                key={contact.id}
                                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left ${contact.staff_id ? 'border-l-4 border-l-[#4A90E2]' : ''}`}
                                title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
                                onClick={() => openContactDetail(contact)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {(contact.business_card_url_enhanced || contact.business_card_url) ? (
                                      <img
                                        src={contact.business_card_url_enhanced || contact.business_card_url}
                                        alt="Visitenkarte"
                                        className={`h-10 w-14 rounded object-cover border ${theme.border}`}
                                      />
                                    ) : (
                                      <div className={`h-10 w-14 rounded border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                                        {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">
                                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.company || '-'}
                                      </p>
                                      {contact.company && (contact.first_name || contact.last_name) && (
                                        <p className={`text-xs ${theme.textMuted}`}>{contact.company}</p>
                                      )}
                                      {contact.position && (
                                        <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                    {contactTypeLabels[contact.contact_type] || contact.contact_type}
                                  </span>
                                </div>
                                <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Adresse: <span className={theme.text}>
                                      {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </span>
                                  </p>
                                  {contact.phone && (
                                    <p className={theme.textMuted}>
                                      Tel: <span className={theme.text}>{contact.phone}</span>
                                    </p>
                                  )}
                                  {contact.mobile && (
                                    <p className={theme.textMuted}>
                                      Mobil: <span className={theme.text}>{contact.mobile}</span>
                                    </p>
                                  )}
                                  {contact.fax && (
                                    <p className={theme.textMuted}>
                                      Fax: <span className={theme.text}>{contact.fax}</span>
                                    </p>
                                  )}
                                  {contact.email && (
                                    <p className={theme.textMuted}>
                                      E-Mail: <span className={theme.text}>{contact.email}</span>
                                    </p>
                                  )}
                                  {!contact.shared && (
                                    <p className={`${theme.textMuted} italic`}>Privat</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Listenansicht */}
                        {contactViewMode === 'list' && (
                          <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                            <table className="w-full text-sm">
                              <thead className={`${theme.bg} border-b ${theme.border}`}>
                                <tr>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary}`}>Name</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden sm:table-cell`}>Firma</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden md:table-cell`}>Adresse</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden lg:table-cell`}>Kontakt</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} w-24`}>Typ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredContacts.map((contact) => (
                                  <tr
                                    key={contact.id}
                                    className={`border-b ${theme.border} ${theme.bgHover} cursor-pointer ${contact.staff_id ? 'border-l-4 border-l-[#4A90E2]' : ''}`}
                                    title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
                                    onClick={() => openContactDetail(contact)}
                                  >
                                    <td className={`px-4 py-3 ${theme.text}`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted} flex-shrink-0`}>
                                          {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                                          </p>
                                          {contact.position && (
                                            <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className={`px-4 py-3 ${theme.textMuted} hidden sm:table-cell`}>
                                      {contact.company || '-'}
                                    </td>
                                    <td className={`px-4 py-3 ${theme.textMuted} hidden md:table-cell`}>
                                      {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </td>
                                    <td className={`px-4 py-3 hidden lg:table-cell`}>
                                      <div className={`text-xs ${theme.textMuted}`}>
                                        {contact.email && <p>{contact.email}</p>}
                                        {contact.phone && <p>{contact.phone}</p>}
                                        {contact.mobile && <p>{contact.mobile}</p>}
                                        {!contact.email && !contact.phone && !contact.mobile && '-'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                        {contactTypeLabels[contact.contact_type] || contact.contact_type}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {/* Visitenkarten-Scan Verarbeitungs-Modal */}
        {businessCardScanning && (
          <div className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} px-8 py-6 flex flex-col items-center gap-4`}>
              <svg className="w-10 h-10 animate-spin text-[#4A90E2]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div className="text-center">
                <p className={`text-sm font-medium ${theme.textPrimary}`}>Visitenkarte wird verarbeitet</p>
                <p className={`text-xs ${theme.textMuted} mt-1`}>OCR und Texterkennung läuft...</p>
              </div>
            </div>
          </div>
        )}

        {editingPharmacy && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeEditModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-xl`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingPharmacy.id ? 'Apotheke bearbeiten' : 'Apotheke hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingPharmacy.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Apotheke anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Name
                    </label>
                    <input
                      value={editForm.name}
                      onChange={(e) => handleEditInput('name', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Strasse
                    </label>
                    <input
                      value={editForm.street}
                      onChange={(e) => handleEditInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={editForm.postalCode}
                      onChange={(e) => handleEditInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={editForm.city}
                      onChange={(e) => handleEditInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Telefonnummer
                    </label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => handleEditInput('phone', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Inhaber / Filialleiter
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={editForm.ownerRole}
                        onChange={(e) => handleEditInput('ownerRole', e.target.value)}
                        className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                        required
                      >
                        <option value="">Bitte wählen</option>
                        <option value="owner">Inhaber</option>
                        <option value="manager">Filialleiter</option>
                      </select>
                      <input
                        value={editForm.owner}
                        onChange={(e) => handleEditInput('owner', e.target.value)}
                        className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Webseite
                    </label>
                    <input
                      value={editForm.website}
                      onChange={(e) => handleEditInput('website', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <input
                      value={editForm.email}
                      onChange={(e) => handleEditInput('email', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      type="email"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Fax
                    </label>
                    <input
                      value={editForm.fax}
                      onChange={(e) => handleEditInput('fax', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                </div>

                {editMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{editMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {editLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingEmailAccount && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeEmailAccountModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-md`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingEmailAccount === 'new' ? 'E-Mail-Konto hinzufügen' : 'E-Mail-Konto bearbeiten'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>JMAP-Zugangsdaten eingeben.</p>
                </div>
                <button
                  type="button"
                  onClick={closeEmailAccountModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {emailAccountMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-500 text-sm">{emailAccountMessage}</p>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    Anzeigename (optional)
                  </label>
                  <input
                    value={emailAccountForm.name}
                    onChange={(e) => setEmailAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Arbeit, Privat"
                    className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    value={emailAccountForm.email}
                    onChange={(e) => setEmailAccountForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    Passwort *
                  </label>
                  <input
                    type="password"
                    value={emailAccountForm.password}
                    onChange={(e) => setEmailAccountForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Passwort"
                    className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeEmailAccountModal}
                    className={`px-4 py-2 rounded-xl border ${theme.border} ${theme.text} font-medium text-sm ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEmailAccount}
                    disabled={emailAccountSaving || !emailAccountForm.email || !emailAccountForm.password}
                    className={`px-4 py-2 rounded-xl ${theme.accent} text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {emailAccountSaving ? 'Prüfe...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingStaff && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeStaffModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-xl`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingStaff.id ? 'Kollegium bearbeiten' : 'Kollegium hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingStaff.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Person anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStaffModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Vorname
                    </label>
                    <input
                      value={staffForm.firstName}
                      onChange={(e) => handleStaffInput('firstName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Nachname
                    </label>
                    <input
                      value={staffForm.lastName}
                      onChange={(e) => handleStaffInput('lastName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Strasse
                    </label>
                    <input
                      value={staffForm.street}
                      onChange={(e) => handleStaffInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={staffForm.postalCode}
                      onChange={(e) => handleStaffInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={staffForm.city}
                      onChange={(e) => handleStaffInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Mobil
                    </label>
                    <input
                      value={staffForm.mobile}
                      onChange={(e) => handleStaffInput('mobile', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={staffForm.email}
                        onChange={(e) => handleStaffInput('email', e.target.value)}
                        className={`flex-1 px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                        type="email"
                      />
                      {currentStaff?.is_admin && !staffForm.authUserId && (
                        <button
                          type="button"
                          onClick={handleSendInvite}
                          disabled={staffInviteLoading || !staffForm.email.trim()}
                          className={`px-3 py-2 rounded-xl text-xs font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                          title="Einladung senden"
                        >
                          {staffInviteLoading ? 'Sende...' : 'Einladen'}
                        </button>
                      )}
                    </div>
                    {staffInviteMessage && (
                      <p className={`text-xs mt-1 ${staffInviteMessage.includes('gesendet') ? 'text-emerald-600' : 'text-rose-400'}`}>
                        {staffInviteMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Beruf
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => handleStaffInput('role', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    >
                      <option value="">Bitte wählen</option>
                      <option value="ApothekerIn">ApothekerIn</option>
                      <option value="PTA">PTA</option>
                      <option value="PKA">PKA</option>
                      <option value="Sonst.">Sonst.</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Apotheke
                    </label>
                    <select
                      value={staffForm.pharmacyId}
                      onChange={(e) => handleStaffInput('pharmacyId', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    >
                      <option value="">Bitte wählen</option>
                      {pharmacies.map((pharmacy) => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Angestellt seit
                    </label>
                    <input
                      type="date"
                      value={staffForm.employedSince}
                      onChange={(e) => handleStaffInput('employedSince', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Avatar
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffAvatarChange}
                      className={`w-full text-xs ${theme.textMuted}`}
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    {staffAvatarPreview ? (
                      <img
                        src={staffAvatarPreview}
                        alt="Avatar Vorschau"
                        className={`h-12 w-12 rounded-full object-cover border ${theme.border}`}
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                        --
                      </div>
                    )}
                    {staffForm.avatarUrl && !staffAvatarFile && (
                      <span className={`text-xs ${theme.textMuted}`}>Aktuell gesetzt</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={linkCurrentUser}
                    className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                    title="Mit aktuellem Login verknüpfen"
                    disabled={!session?.user?.id}
                  >
                    {staffForm.authUserId ? 'Login verknüpft' : 'Mit aktuellem Login verknüpfen'}
                  </button>
                  <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={staffForm.isAdmin}
                      onChange={(e) => handleStaffInput('isAdmin', e.target.checked)}
                      className="accent-[#4A90E2]"
                    />
                    Admin
                  </label>
                </div>

                {staffSaveMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{staffSaveMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeStaffModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={staffSaveLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {staffSaveLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kontakt Detail-Ansicht */}
        {selectedContact && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={() => setSelectedContact(null)}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {[selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ') || selectedContact.company || 'Kontakt'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {selectedContact.company && (selectedContact.first_name || selectedContact.last_name) ? selectedContact.company : ''}
                    {selectedContact.position ? (selectedContact.company ? ' · ' : '') + selectedContact.position : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedContact.staff_id && (
                    <button
                      type="button"
                      onClick={() => {
                        openContactModal(selectedContact)
                        setSelectedContact(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      title="Kontakt bearbeiten"
                    >
                      Bearbeiten
                    </button>
                  )}
                  {selectedContact.staff_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('staff')
                        setSelectedContact(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      title="Im Kollegium bearbeiten"
                    >
                      Im Kollegium bearbeiten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Visitenkarte / Bild */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`text-xs font-medium ${theme.textSecondary}`}>Visitenkarte</h4>
                      {selectedCardHasEnhanced && selectedCardHasOriginal && (
                        <div className={`flex items-center rounded-lg border ${theme.border} overflow-hidden`}>
                          <button
                            type="button"
                            onClick={() => setSelectedContactCardView('enhanced')}
                            className={`px-2.5 py-1 text-[11px] ${selectedContactCardView === 'enhanced' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                            title="KI-optimiert anzeigen"
                          >
                            KI
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedContactCardView('original')}
                            className={`px-2.5 py-1 text-[11px] ${selectedContactCardView === 'original' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                            title="Original anzeigen"
                          >
                            Original
                          </button>
                        </div>
                      )}
                    </div>
                    {selectedCardUrl ? (
                      <a
                        href={selectedCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {selectedCardUrl.toLowerCase().endsWith('.pdf') ? (
                          <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                            <iframe
                              src={selectedCardUrl}
                              className="w-full h-80"
                              title="Visitenkarte PDF"
                            />
                            <p className={`text-xs ${theme.textMuted} text-center py-2 border-t ${theme.border}`}>
                              Klicken zum Öffnen in neuem Tab
                            </p>
                          </div>
                        ) : (
                          <img
                            src={selectedCardUrl}
                            alt="Visitenkarte"
                            className={`w-full rounded-xl border ${theme.border} object-contain max-h-80`}
                          />
                        )}
                      </a>
                    ) : (
                      <div className={`h-40 rounded-xl border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                        Keine Visitenkarte hinterlegt
                      </div>
                    )}
                  </div>

                  {/* Kontaktdaten */}
                  <div className="space-y-4">
                    <div>
                      <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Kontaktdaten</h4>
                      <div className={`rounded-xl border ${theme.border} divide-y ${theme.border}`}>
                        {selectedContact.email && (
                          <a href={`mailto:${selectedContact.email}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.email}</span>
                          </a>
                        )}
                        {selectedContact.phone && (
                          <a href={`tel:${selectedContact.phone}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.phone}</span>
                          </a>
                        )}
                        {selectedContact.mobile && (
                          <a href={`tel:${selectedContact.mobile}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.mobile}</span>
                          </a>
                        )}
                        {selectedContact.fax && (
                          <div className={`flex items-center gap-3 px-4 py-3`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.fax}</span>
                          </div>
                        )}
                        {selectedContact.website && (
                          <a href={selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.website}</span>
                          </a>
                        )}
                        {!selectedContact.email && !selectedContact.phone && !selectedContact.mobile && !selectedContact.fax && !selectedContact.website && (
                          <p className={`px-4 py-3 text-sm ${theme.textMuted}`}>Keine Kontaktdaten</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Adresse</h4>
                      <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                        {selectedContact.street || selectedContact.postal_code || selectedContact.city ? (
                          <div className={`text-sm ${theme.text}`}>
                            {selectedContact.street && <p>{selectedContact.street}</p>}
                            {(selectedContact.postal_code || selectedContact.city) && (
                              <p>{[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}</p>
                            )}
                            {selectedContact.country && selectedContact.country !== 'DE' && (
                              <p>{selectedContact.country}</p>
                            )}
                          </div>
                        ) : (
                          <p className={`text-sm ${theme.textMuted}`}>Keine Adresse</p>
                        )}
                      </div>
                    </div>

                    {selectedContact.notes && (
                      <div>
                        <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Notizen</h4>
                        <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                          <p className={`text-sm ${theme.text} whitespace-pre-wrap`}>{selectedContact.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                        {contactTypeLabels[selectedContact.contact_type] || selectedContact.contact_type}
                      </span>
                      {!selectedContact.shared && (
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                          Privat
                        </span>
                      )}
                      {selectedContact.staff_id && (
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#4A90E2]/10 text-[#4A90E2] border border-[#4A90E2]/20`}>
                          Mitarbeiter
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplikat-Dialog */}
        {duplicateDialogOpen && duplicateCheckResult && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={() => setDuplicateDialogOpen(false)}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[90vh] overflow-y-auto`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`px-5 py-4 border-b ${theme.border}`}>
                <h3 className="text-base font-semibold">Mögliche Duplikate gefunden</h3>
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  Erkannt: {duplicateCheckResult.ocrData.firstName} {duplicateCheckResult.ocrData.lastName}
                  {duplicateCheckResult.ocrData.company && ` bei ${duplicateCheckResult.ocrData.company}`}
                </p>
              </div>

              <div className="p-5 space-y-4">
                {duplicateCheckResult.checks.map((check, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${theme.border} space-y-3`}>
                    <div className={`text-xs font-medium ${theme.textSecondary}`}>
                      {check.type === 'email' && `Gleiche E-Mail: ${check.field}`}
                      {check.type === 'phone' && `Gleiche Telefonnummer: ${check.field}`}
                      {check.type === 'company' && `Bereits Kontakt bei: ${check.field}`}
                    </div>

                    {check.matches.map((match) => (
                      <div key={match.id} className={`p-3 rounded-lg ${theme.bg} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium ${theme.text}`}>
                              {match.first_name} {match.last_name}
                            </p>
                            <p className={`text-xs ${theme.textMuted}`}>
                              {match.position}{match.position && match.company && ' bei '}{match.company}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {check.type !== 'company' && (
                            <button
                              type="button"
                              onClick={() => handleDuplicateUpdate(match)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.accent} text-white`}
                            >
                              Aktualisieren
                            </button>
                          )}
                          {check.type === 'company' && (
                            <button
                              type="button"
                              onClick={() => handleNewRepresentative(match)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-white`}
                            >
                              Neuer Vertreter (ersetzt {match.first_name})
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <div className={`pt-4 border-t ${theme.border} flex flex-wrap gap-2 justify-end`}>
                  <button
                    type="button"
                    onClick={() => setDuplicateDialogOpen(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewContact}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
                  >
                    Trotzdem neu anlegen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingContact && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeContactModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingContact.id ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingContact.id ? 'Änderungen werden sofort gespeichert.' : 'Neuen Kontakt anlegen.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingContact.id && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteContact(editingContact.id)
                        closeContactModal()
                      }}
                      className={`p-2 rounded-lg ${theme.danger}`}
                      title="Kontakt löschen"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeContactModal}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Popup schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="p-5 space-y-4">
                {/* Visitenkarte Upload */}
                <div>
                  <label className={`block text-xs font-medium mb-2 ${theme.textSecondary}`}>
                    Visitenkarte
                  </label>
                  <div className="flex items-center gap-4">
                    {contactCardPreview ? (
                      <div className="relative">
                        <img
                          src={contactCardPreview}
                          alt="Visitenkarte Vorschau"
                          className={`h-20 w-32 rounded-lg object-cover border ${theme.border}`}
                          style={{ transform: `rotate(${contactCardRotation}deg)` }}
                        />
                        {!contactCardEnhancedPreview && (
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => setContactCardRotation((r) => (r - 90 + 360) % 360)}
                              className={`p-1 rounded ${theme.surface} border ${theme.border} ${theme.bgHover}`}
                              title="90° nach links drehen"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setContactCardRotation((r) => (r + 90) % 360)}
                              className={`p-1 rounded ${theme.surface} border ${theme.border} ${theme.bgHover}`}
                              title="90° nach rechts drehen"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`h-20 w-32 rounded-lg border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                        <Icons.Photo />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={contactCardInputRef}
                        onChange={handleContactCardChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => contactCardInputRef.current?.click()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      >
                        {contactCardPreview ? 'Ändern' : 'Hochladen'}
                      </button>
                      {contactCardPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setContactCardFile(null)
                            setContactCardPreview('')
                            setContactCardEnhancedFile(null)
                            setContactCardEnhancedPreview('')
                            setContactCardEnhancing(false)
                            setContactCardRotation(0)
                            handleContactInput('businessCardUrl', '')
                            handleContactInput('businessCardUrlEnhanced', '')
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.danger}`}
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  </div>
                  {contactCardEnhancing && (
                    <div className={`mt-3 flex items-center gap-2 text-xs ${theme.textMuted}`}>
                      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                      KI-Optimierung läuft...
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Vorname
                    </label>
                    <input
                      value={contactForm.firstName}
                      onChange={(e) => handleContactInput('firstName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Nachname
                    </label>
                    <input
                      value={contactForm.lastName}
                      onChange={(e) => handleContactInput('lastName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Firma
                    </label>
                    <input
                      value={contactForm.company}
                      onChange={(e) => handleContactInput('company', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Position
                    </label>
                    <input
                      value={contactForm.position}
                      onChange={(e) => handleContactInput('position', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => handleContactInput('email', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Webseite
                    </label>
                    <input
                      value={contactForm.website}
                      onChange={(e) => handleContactInput('website', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Telefon
                    </label>
                    <input
                      value={contactForm.phone}
                      onChange={(e) => handleContactInput('phone', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Mobil
                    </label>
                    <input
                      value={contactForm.mobile}
                      onChange={(e) => handleContactInput('mobile', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Fax
                    </label>
                    <input
                      value={contactForm.fax}
                      onChange={(e) => handleContactInput('fax', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Straße
                    </label>
                    <input
                      value={contactForm.street}
                      onChange={(e) => handleContactInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={contactForm.postalCode}
                      onChange={(e) => handleContactInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={contactForm.city}
                      onChange={(e) => handleContactInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Land
                    </label>
                    <input
                      value={contactForm.country}
                      onChange={(e) => handleContactInput('country', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Kategorie
                    </label>
                    <select
                      value={contactForm.contactType}
                      onChange={(e) => handleContactInput('contactType', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    >
                      <option value="business">Geschäftlich</option>
                      <option value="supplier">Lieferant</option>
                      <option value="customer">Kunde</option>
                      <option value="other">Sonstige</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Notizen
                    </label>
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => handleContactInput('notes', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm resize-none`}
                    />
                  </div>
                </div>

                <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                  <input
                    type="checkbox"
                    checked={contactForm.shared}
                    onChange={(e) => handleContactInput('shared', e.target.checked)}
                    className="accent-[#4A90E2]"
                  />
                  Für alle Mitarbeiter sichtbar
                </label>

                {contactSaveMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{contactSaveMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeContactModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={contactSaveLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {contactSaveLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PDF-Modal für GH-Rechnungen */}
        {pdfModalOpen && selectedPdf && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closePdfModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-5xl h-[90vh] flex flex-col`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border} flex-shrink-0`}>
                <div>
                  <h3 className="text-base font-semibold">{selectedPdf.grosshaendler} - {selectedPdf.rechnungsnummer}</h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {new Date(selectedPdf.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    title="In neuem Tab öffnen"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href={selectedPdf.url}
                    download={selectedPdf.dateiname}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    title="Herunterladen"
                  >
                    <Icons.Download />
                  </a>
                  <button
                    type="button"
                    onClick={closePdfModal}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedPdf.url}
                  className="w-full h-full border-0"
                  title={`PDF ${selectedPdf.rechnungsnummer}`}
                />
              </div>
            </div>
          </div>
        )}

        {weatherModalOpen && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeWeatherModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-md`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">Wetter-Ort</h3>
                  <p className={`text-xs ${theme.textMuted}`}>Standard ist der Apothekenort.</p>
                </div>
                <button
                  type="button"
                  onClick={closeWeatherModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setWeatherLocation(weatherInput.trim())
                  closeWeatherModal()
                }}
                className="p-5 space-y-4"
              >
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    Ort
                  </label>
                  <input
                    value={weatherInput}
                    onChange={(event) => setWeatherInput(event.target.value)}
                    className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    placeholder="z.B. Berlin"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeWeatherModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white`}
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {photoEditorOpen && selectedPhoto && (
          <div className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-3xl max-h-[90vh] overflow-auto`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text}`}>Foto bearbeiten</h3>
                <button
                  type="button"
                  onClick={closePhotoEditor}
                  className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-center">
                  <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop}>
                    <img
                      ref={photoImgRef}
                      src={selectedPhoto.url}
                      alt="Bearbeiten"
                      className="max-w-full max-h-[50vh]"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                      Helligkeit: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                      Kontrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>

                  <div className={`border-t ${theme.border} pt-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-medium ${theme.textSecondary}`}>
                        OCR-Text
                      </label>
                      {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                        <button
                          type="button"
                          onClick={() => runOcrForPhoto(selectedPhoto.name, selectedPhoto.url)}
                          className={`text-xs px-3 py-1 rounded-lg ${theme.accent} text-white`}
                        >
                          OCR starten
                        </button>
                      )}
                    </div>
                    {ocrProcessing[selectedPhoto.name] && (
                      <p className={`text-sm ${theme.accentText}`}>OCR wird ausgeführt...</p>
                    )}
                    {photoOcrData[selectedPhoto.name]?.status === 'completed' && (
                      <div className={`${theme.input} border rounded-lg p-3 max-h-40 overflow-auto`}>
                        <pre className={`text-sm ${theme.text} whitespace-pre-wrap font-sans`}>
                          {photoOcrData[selectedPhoto.name].text}
                        </pre>
                      </div>
                    )}
                    {photoOcrData[selectedPhoto.name]?.status === 'error' && (
                      <p className="text-sm text-rose-400">OCR fehlgeschlagen</p>
                    )}
                    {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                      <p className={`text-sm ${theme.textMuted}`}>Noch kein OCR durchgeführt</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={closePhotoEditor}
                  className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.textSecondary} border ${theme.border}`}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveEditedPhoto}
                  disabled={photoSaving}
                  className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
                >
                  {photoSaving ? 'Speichere...' : 'Als Kopie speichern'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedApoMessage && (
          <div
            className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}
            onClick={() => setSelectedApoMessage(null)}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-start justify-between p-4 border-b ${theme.border}`}>
                <div className="flex-1 pr-4">
                  <h3 className={`text-lg font-semibold ${theme.text}`}>
                    {selectedApoMessage.type === 'lav'
                      ? (selectedApoMessage.subject || `LAV-Info ${selectedApoMessage.ausgabe}`)
                      : selectedApoMessage.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm ${theme.textMuted}`}>
                      {selectedApoMessage.type === 'lav'
                        ? (selectedApoMessage.datum ? new Date(selectedApoMessage.datum).toLocaleDateString('de-DE') : '')
                        : (selectedApoMessage.date ? new Date(selectedApoMessage.date).toLocaleDateString('de-DE') : '')}
                    </span>
                    {selectedApoMessage.type === 'lav' && selectedApoMessage.ausgabe && (
                      <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                        Ausgabe {selectedApoMessage.ausgabe}
                      </span>
                    )}
                    {selectedApoMessage.category && (
                      <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                        {selectedApoMessage.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedApoMessage.type === 'amk' && (() => {
                    const hasSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                    const isComplete = existingDokumentationen.length > 0 && hasSignature
                    return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDokumentationBemerkung('')
                          setDokumentationSignature(null)
                          setShowSignatureCanvas(false)
                          setShowDokumentationModal(true)
                        }}
                        className={`${isComplete ? theme.primaryBg : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAmkPdf(selectedApoMessage)}
                        className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                        title="Als PDF herunterladen"
                      >
                        <Icons.Download />
                      </button>
                    </>
                    )
                  })()}
                  {selectedApoMessage.type === 'recall' && (() => {
                    const hasSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                    const isComplete = existingDokumentationen.length > 0 && hasSignature
                    return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDokumentationBemerkung('')
                          setDokumentationSignature(null)
                          setShowSignatureCanvas(false)
                          setShowDokumentationModal(true)
                        }}
                        className={`${isComplete ? theme.primaryBg : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadRecallPdf(selectedApoMessage)}
                        className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                        title="Als PDF herunterladen"
                      >
                        <Icons.Download />
                      </button>
                    </>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={() => setSelectedApoMessage(null)}
                    className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {selectedApoMessage.type === 'amk' && selectedApoMessage.institution && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Institution:</strong> {selectedApoMessage.institution}
                  </p>
                )}

                {selectedApoMessage.type === 'recall' && selectedApoMessage.product_name && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Produkt:</strong> {selectedApoMessage.product_name}
                  </p>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.recall_number && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Rückrufnummer:</strong> {selectedApoMessage.recall_number}
                  </p>
                )}

                {/* Volltext für Rückrufe - oben anzeigen */}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.full_text && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedApoMessage.full_text}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* AI-Analyse Felder für Rückrufe */}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_alle !== null && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Alle Chargen betroffen:</strong> {selectedApoMessage.ai_chargen_alle ? 'Ja' : 'Nein'}
                  </p>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_liste && selectedApoMessage.ai_chargen_liste.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Chargen:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_chargen_liste.map((charge, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                          {charge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_pzn_betroffen && selectedApoMessage.ai_pzn_betroffen.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene PZN (antippen für Foto):</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_pzn_betroffen.map((pzn, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handlePznClick(pzn)}
                          disabled={pznFotoUploading}
                          className={`text-xs px-2 py-1 rounded ${theme.accent} text-white font-mono hover:opacity-80 transition-opacity relative ${pznFotoUploading ? 'opacity-50' : ''}`}
                          title={savedPznFotos[pzn] ? `Foto für PZN ${pzn} ersetzen` : `Foto für PZN ${pzn} aufnehmen`}
                        >
                          {pzn}
                          {pznFotoUploading && activePzn === pzn && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white animate-pulse" />
                          )}
                          {savedPznFotos[pzn] && !(pznFotoUploading && activePzn === pzn) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_packungsgrößen && selectedApoMessage.ai_packungsgrößen.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Packungsgrößen:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_packungsgrößen.map((größe, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                          {größe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* LAV-Info Themen */}
                {selectedApoMessage.type === 'lav' && selectedApoMessage.lav_themes && selectedApoMessage.lav_themes.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-2`}>Themen dieser Ausgabe:</p>
                    <div className="space-y-2">
                      {selectedApoMessage.lav_themes
                        .sort((a, b) => (a.punkt_nr || 0) - (b.punkt_nr || 0))
                        .map((thema) => (
                          thema.volltext ? (
                            <details
                              key={thema.id}
                              className={`${theme.surface} border ${theme.border} rounded-lg overflow-hidden`}
                            >
                              <summary className={`px-3 py-2 cursor-pointer ${theme.bgHover} flex items-center gap-2`}>
                                {thema.punkt_nr && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${theme.accent} text-white font-medium`}>
                                    {thema.punkt_nr}
                                  </span>
                                )}
                                <span className={`text-sm font-medium ${theme.text}`}>{thema.titel || 'Kein Titel'}</span>
                                {thema.ist_arbeitsrecht && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                                    Arbeitsrecht
                                  </span>
                                )}
                              </summary>
                              <div className={`px-3 py-2 border-t ${theme.border}`}>
                                <div className={`text-sm ${theme.text} markdown-content`}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{thema.volltext}</ReactMarkdown>
                                </div>
                              </div>
                            </details>
                          ) : (
                            <div
                              key={thema.id}
                              className={`${theme.surface} border ${theme.border} rounded-lg px-3 py-2 flex items-center gap-2`}
                            >
                              {thema.punkt_nr && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${theme.accent} text-white font-medium`}>
                                  {thema.punkt_nr}
                                </span>
                              )}
                              <span className={`text-sm font-medium ${theme.text}`}>{thema.titel || 'Kein Titel'}</span>
                              {thema.ist_arbeitsrecht && (
                                <span className={`text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                                  Arbeitsrecht
                                </span>
                              )}
                            </div>
                          )
                        ))}
                    </div>
                  </div>
                )}

                {/* LAV-Info PDF Links */}
                {selectedApoMessage.type === 'lav' && selectedApoMessage.main_pdf_url && (
                  <div className="mb-4">
                    <a
                      href={`${supabaseUrl}${selectedApoMessage.main_pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm ${theme.accentText} hover:underline`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF herunterladen
                    </a>
                  </div>
                )}

                {selectedApoMessage.type === 'lav' && selectedApoMessage.attachment_urls && selectedApoMessage.attachment_urls.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Anhänge:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApoMessage.attachment_urls.map((url, i) => (
                        <a
                          key={i}
                          href={`${supabaseUrl}${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${theme.surface} ${theme.accentText} hover:underline border ${theme.border}`}
                        >
                          Anhang {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beschreibung, Produkte, wichtige Infos nur für Nicht-AMK (bei AMK ist alles im full_text) */}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.description && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Beschreibung:</p>
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedApoMessage.description}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.affected_products && selectedApoMessage.affected_products.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Produkte:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.affected_products.map((p, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{p}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.important_info && selectedApoMessage.important_info.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Wichtige Informationen:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.important_info.map((info, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{info}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.type !== 'recall' && selectedApoMessage.full_text && (
                  <div>
                    {selectedApoMessage.type !== 'amk' && (
                      <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                    )}
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedApoMessage.type === 'amk'
                          ? selectedApoMessage.full_text.replace(/^#[^\n]*\n+/, '')
                          : selectedApoMessage.full_text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {selectedApoMessage.message_url && (
                  <a
                    href={selectedApoMessage.message_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
                  >
                    Zur Originalquelle →
                  </a>
                )}
                {selectedApoMessage.recall_url && (
                  <a
                    href={selectedApoMessage.recall_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
                  >
                    Zur Originalquelle →
                  </a>
                )}

                {/* Gespeicherte Dokumentationen für AMK und Rückrufe - ganz unten */}
                {(selectedApoMessage.type === 'amk' || selectedApoMessage.type === 'recall') && existingDokumentationen.length > 0 && (
                  <div className={`mt-6 p-3 rounded-xl ${theme.surface} border ${theme.border}`}>
                    <p className={`text-sm font-medium ${theme.accentText} mb-2`}>Dokumentation:</p>
                    <div className="space-y-2">
                      {existingDokumentationen.map((dok) => (
                        <div key={dok.id} className={`p-2 rounded-lg bg-white border ${theme.border}`}>
                          {dok.bemerkung && (
                            <p className={`text-sm ${theme.text}`}>{dok.bemerkung}</p>
                          )}
                          {dok.unterschrift_data && (
                            <img src={dok.unterschrift_data} alt="Unterschrift" className="h-12 mt-2 border rounded" />
                          )}
                          <p className={`text-xs ${theme.textMuted} mt-1`}>
                            {dok.erstellt_von_name && <span className="font-medium">{dok.erstellt_von_name}</span>}
                            {dok.erstellt_von_name && dok.erstellt_am && ' · '}
                            {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`flex justify-end p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => setSelectedApoMessage(null)}
                  className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dokumentation Modal (AMK und Rückrufe) */}
        {showDokumentationModal && (selectedApoMessage?.type === 'amk' || selectedApoMessage?.type === 'recall') && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-[60] p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[90vh] flex flex-col`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text}`}>Dokumentation</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDokumentationModal(false)
                    setShowSignatureCanvas(false)
                  }}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Bestehende Dokumentationen */}
                {existingDokumentationen.length > 0 && (
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${theme.textSecondary}`}>Bisherige Einträge:</p>
                    {existingDokumentationen.map((dok) => (
                      <div key={dok.id} className={`p-3 rounded-lg ${theme.surface} border ${theme.border}`}>
                        {dok.bemerkung && (
                          <p className={`text-sm ${theme.text} mb-2`}>{dok.bemerkung}</p>
                        )}
                        {dok.unterschrift_data && (
                          <img src={dok.unterschrift_data} alt="Unterschrift" className="h-16 border rounded" />
                        )}
                        {/* PZN-Fotos anzeigen */}
                        {dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(dok.pzn_fotos).map(([pzn, path]) => (
                              <a
                                key={pzn}
                                href={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block"
                              >
                                <img
                                  src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                                  alt={`PZN ${pzn}`}
                                  className="h-16 rounded border hover:opacity-80 transition-opacity"
                                />
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                                  {pzn}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs ${theme.textMuted} mt-2`}>
                          {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Neuer Eintrag */}
                {(() => {
                  const hasExistingSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                  return (
                <div className="space-y-3">
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>
                    {hasExistingSignature ? 'Ergänzung hinzufügen:' : 'Neuer Eintrag:'}
                  </p>
                  <textarea
                    value={dokumentationBemerkung}
                    onChange={(e) => setDokumentationBemerkung(e.target.value)}
                    placeholder={hasExistingSignature ? 'Ergänzende Bemerkung...' : 'Bemerkung eingeben...'}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none`}
                  />

                  {/* PZN-Fotos Vorschau (nur für Rückrufe) */}
                  {selectedApoMessage?.type === 'recall' && Object.keys(savedPznFotos).length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${theme.textSecondary}`}>
                        Gespeicherte PZN-Fotos ({Object.keys(savedPznFotos).length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(savedPznFotos).map(([pzn, path]) => (
                          <div key={pzn} className="relative">
                            <img
                              src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                              alt={`PZN ${pzn}`}
                              className="h-20 rounded border"
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                              {pzn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unterschrift-Bereich - nur wenn noch keine Unterschrift existiert */}
                  {!hasExistingSignature && !showSignatureCanvas && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignatureCanvas(true)
                        setTimeout(initSignatureCanvas, 50)
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textMuted} hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors`}
                    >
                      Unterschreiben
                    </button>
                  )}
                  {!hasExistingSignature && showSignatureCanvas && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${theme.textSecondary}`}>Unterschrift:</p>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className={`text-xs ${theme.accentText} hover:underline`}
                        >
                          Löschen
                        </button>
                      </div>
                      <canvas
                        ref={signatureCanvasRef}
                        width={400}
                        height={150}
                        className={`w-full border ${theme.border} rounded-xl bg-white touch-none cursor-crosshair`}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                  )}
                </div>
                  )
                })()}
              </div>

              <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDokumentationModal(false)
                    setShowSignatureCanvas(false)
                  }}
                  className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.text} font-medium`}
                >
                  Abbrechen
                </button>
                {(() => {
                  const hasExistingSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                  const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
                  // Wenn bereits unterschrieben: Text ODER PZN-Fotos erforderlich
                  // Wenn noch nicht unterschrieben: (Text ODER PZN-Fotos) UND Unterschrift erforderlich
                  const hasContent = dokumentationBemerkung.trim() || hasSavedPznFotos
                  const isDisabled = hasExistingSignature
                    ? !hasContent
                    : (!hasContent || !dokumentationSignature)
                  return (
                    <button
                      type="button"
                      onClick={saveDokumentation}
                      disabled={dokumentationLoading || isDisabled}
                      className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
                    >
                      {dokumentationLoading ? 'Speichern...' : hasExistingSignature ? 'Hinzufügen' : 'Speichern'}
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {editingEvent && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>
                  {editingEvent.id ? 'Termin bearbeiten' : 'Neuer Termin'}
                </h3>
                <button
                  type="button"
                  onClick={closeEventModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Titel *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Terminname"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, allDay: e.target.checked }))}
                    className={`rounded ${theme.border}`}
                  />
                  <span className={`text-sm ${theme.textSecondary}`}>Ganztägig</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Start</label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                          endDate: prev.endDate || e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
                    />
                    {!eventForm.allDay && (
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                      />
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ende</label>
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
                    />
                    {!eventForm.allDay && (
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ort</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                {eventError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{eventError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {editingEvent.id && canWriteCurrentCalendar() && (
                    <button
                      type="button"
                      onClick={() => deleteEvent(editingEvent.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.danger} border ${theme.border}`}
                    >
                      Löschen
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={closeEventModal}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  {canWriteCurrentCalendar() && (
                    <button
                      type="button"
                      onClick={() => (editingEvent.id ? updateEvent(editingEvent.id) : createEvent())}
                      disabled={eventSaving || !eventForm.title.trim()}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
                    >
                      {eventSaving ? 'Speichern...' : 'Speichern'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kalender erstellen/bearbeiten Modal (Admin) */}
        {editingCalendar && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>
                  {editingCalendar.id ? 'Kalender bearbeiten' : 'Neuer Kalender'}
                </h3>
                <button
                  type="button"
                  onClick={closeCalendarModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Name *</label>
                  <input
                    type="text"
                    value={calendarForm.name}
                    onChange={(e) => setCalendarForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Kalendername"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
                  <textarea
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Farbe</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={calendarForm.color}
                      onChange={(e) => setCalendarForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <div className="flex gap-2">
                      {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCalendarForm((prev) => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-lg border-2 ${calendarForm.color === color ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={closeCalendarModal}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => (editingCalendar.id ? updateCalendar(editingCalendar.id) : createCalendar())}
                    disabled={calendarSaving || !calendarForm.name.trim()}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
                  >
                    {calendarSaving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Berechtigungen Modal (Admin) */}
        {permissionsModalOpen && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[80vh] overflow-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>Berechtigungen verwalten</h3>
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className={`p-4 rounded-xl border ${theme.border} mb-6`}>
                <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>Berechtigung hinzufügen</h4>
                <div className="flex gap-2">
                  <select id="newPermUser" className={`flex-1 px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
                    <option value="">Mitarbeiter wählen...</option>
                    {staff
                      .filter((s) => s.auth_user_id && !calendarPermissions.some((p) => p.user_id === s.auth_user_id))
                      .map((s) => (
                        <option key={s.id} value={s.auth_user_id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                  </select>
                  <select id="newPermLevel" className={`px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
                    <option value="read">Lesen</option>
                    <option value="write">Schreiben</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const userId = document.getElementById('newPermUser').value
                      const perm = document.getElementById('newPermLevel').value
                      if (userId) addCalendarPermission(selectedCalendarId, userId, perm)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {permissionsLoading ? (
                  <p className={theme.textMuted}>Laden...</p>
                ) : calendarPermissions.length === 0 ? (
                  <p className={theme.textMuted}>Keine Berechtigungen vergeben.</p>
                ) : (
                  calendarPermissions.map((perm) => (
                    <div key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border ${theme.border}`}>
                      <div>
                        <p className={`font-medium ${theme.text}`}>
                          {perm.staffMember?.first_name} {perm.staffMember?.last_name}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>{perm.staffMember?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={perm.permission}
                          onChange={(e) => addCalendarPermission(selectedCalendarId, perm.user_id, e.target.value)}
                          className={`px-2 py-1 rounded-lg border ${theme.input} text-xs ${theme.text}`}
                        >
                          <option value="read">Lesen</option>
                          <option value="write">Schreiben</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCalendarPermission(perm.id, selectedCalendarId)}
                          className={`p-1.5 rounded-lg ${theme.danger}`}
                          title="Berechtigung entfernen"
                        >
                          <Icons.X />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  // Login / Forgot Password / Reset Password views
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <img src="/logo.png" alt="Kaeee" className="h-10" />
            <p className={`text-sm ${theme.textMuted}`}>
              {authView === 'login' && 'Willkommen zurück'}
              {authView === 'forgot' && 'Passwort zurücksetzen'}
              {authView === 'resetPassword' && 'Neues Passwort setzen'}
            </p>
          </div>
        </div>

        {/* Login Form */}
        {authView === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Einloggen"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird geladen...' : 'Einloggen'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthView('forgot'); setMessage(''); setSuccessMessage(''); }}
              className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
            >
              Passwort vergessen?
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {authView === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="email@example.com"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Link senden"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthView('login'); setMessage(''); setSuccessMessage(''); }}
              className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
            >
              Zurück zum Login
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {authView === 'resetPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Passwort speichern"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App
