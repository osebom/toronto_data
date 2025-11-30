import { IconType } from 'react-icons';
import { FaBrush, FaBook, FaRunning, FaFutbol, FaGlassCheers, FaChalkboardTeacher, FaLaptop, FaFlagCheckered, FaMicrophoneAlt } from 'react-icons/fa';
import { GiCampingTent } from 'react-icons/gi';
import { MdNightlife } from 'react-icons/md';
import { TbMicroscope } from 'react-icons/tb';
import { BiWorld } from 'react-icons/bi';

const PaletteIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/paint-palette.png"
    width={size}
    height={size}
    alt="Arts and exhibits icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const ArtisanIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/potters-wheel.png"
    width={size}
    height={size}
    alt="Artisan icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const MarketCrateIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/shopping-basket.png"
    width={size}
    height={size}
    alt="Farmers market icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const LivePerformanceIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/micro.png"
    width={size}
    height={size}
    alt="Live performance icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const CharityIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/trust.png"
    width={size}
    height={size}
    alt="Charity donation icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const FoodIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/restaurant.png"
    width={size}
    height={size}
    alt="Food and culinary icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const MusicIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/music.png"
    width={size}
    height={size}
    alt="Music icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const FilmIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/documentary.png"
    width={size}
    height={size}
    alt="Film icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const OtherIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/calendar--v2.png"
    width={size}
    height={size}
    alt="Other category icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const ConsumerShowIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/shopping-bag.png"
    width={size}
    height={size}
    alt="Consumer show and convention icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const HistoryIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/exhibition.png"
    width={size}
    height={size}
    alt="History icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const RainbowIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/rainbow.png"
    width={size}
    height={size}
    alt="2SLGBTQ+ icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const LiteraryIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/book-shelf.png"
    width={size}
    height={size}
    alt="Literary icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const CelebrationsIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/confetti.png"
    width={size}
    height={size}
    alt="Celebrations icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const EnvironmentalIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/nature.png"
    width={size}
    height={size}
    alt="Environmental icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const FamilyIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/color/96/family.png"
    width={size}
    height={size}
    alt="Family and children icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

const ComedyIcon: IconType = ({ size = 24, className, ...props }) => (
  <img
    src="https://img.icons8.com/3d-fluency/94/comedy.png"
    width={size}
    height={size}
    alt="Comedy icon"
    className={className}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      borderRadius: '9999px',
      padding: size * 0.04,
      backgroundColor: 'transparent',
    }}
    {...props}
  />
);

type CategoryGroup = {
  icon: IconType;
  categories: string[];
};

const CATEGORY_GROUPS: CategoryGroup[] = [
  { icon: PaletteIcon, categories: ['Arts/Exhibits', 'Museum'] },
  { icon: ArtisanIcon, categories: ['Artisan'] },
  { icon: CelebrationsIcon, categories: ['Celebrations', 'Street Festival', 'Parade'] },
  { icon: CharityIcon, categories: ['Charity/Cause'] },
  { icon: ComedyIcon, categories: ['Comedy', 'Theatre'] },
  { icon: ConsumerShowIcon, categories: ['Consumer Show/Convention', 'Public Square'] },
  { icon: RainbowIcon, categories: ['Cultural', 'Indigenous', '2SLGBTQ+'] },
  { icon: LivePerformanceIcon, categories: ['Dance', 'Live Performances'] },
  { icon: EnvironmentalIcon, categories: ['Environmental'] },
  { icon: FamilyIcon, categories: ['Family/Children'] },
  { icon: MarketCrateIcon, categories: ['Farmers Market', "Farmers' Market"] },
  { icon: FilmIcon, categories: ['Film'] },
  { icon: FoodIcon, categories: ['Food/Culinary'] },
  { icon: HistoryIcon, categories: ['History'] },
  { icon: LiteraryIcon, categories: ['Literary', 'Talks'] },
  { icon: MusicIcon, categories: ['Music'] },
  { icon: MdNightlife, categories: ['Nightlife'] },
  { icon: FaFlagCheckered, categories: ['Run/Walk', 'Sports'] },
  { icon: FaGlassCheers, categories: ['Nightlife', 'Celebrations'] },
  { icon: FaChalkboardTeacher, categories: ['Seminars/Workshops'] },
  { icon: GiCampingTent, categories: ['Street Festival'] },
  { icon: FaMicrophoneAlt, categories: ['Talks', 'Seminars/Workshops'] },
  { icon: FaLaptop, categories: ['Virtual/Online Event'] },
  { icon: OtherIcon, categories: ['Other'] },
  { icon: TbMicroscope, categories: ['Science/Technology'] },
  { icon: BiWorld, categories: ['Tour'] },
];

const FALLBACK_ICON = OtherIcon;

export function getCategoryIcon(categories: string[]): IconType {
  for (const category of categories) {
    const group = CATEGORY_GROUPS.find((group) =>
      group.categories.includes(category)
    );
    if (group) {
      return group.icon;
    }
  }
  return FALLBACK_ICON;
}
