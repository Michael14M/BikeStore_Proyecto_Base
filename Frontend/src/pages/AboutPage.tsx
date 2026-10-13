import type { NavigationState } from '../types';

const imgHero = '/assets/020b3.png';
const imgBanner = '/assets/6b85e.png';

interface AboutPageProps {
  navigate: (state: NavigationState) => void;
}

const values = [
  {
    title: 'RENDIMIENTO',
    description: 'Cada producto que ofrecemos ha sido seleccionado para maximizar el rendimiento del ciclista, desde el amateur hasta el profesional.',
    icon: '⚡',
  },
  {
    title: 'CALIDAD',
    description: 'Trabajamos exclusivamente con las mejores marcas del mundo. Sin compromisos. Sin segundas opciones.',
    icon: '🏆',
  },
  {
    title: 'COMUNIDAD',
    description: 'Somos más que una tienda. Somos el punto de encuentro de la comunidad ciclista más apasionada de Colombia.',
    icon: '🤝',
  },
  {
    title: 'INNOVACIÓN',
    description: 'Siempre a la vanguardia de la tecnología en ciclismo. Somos los primeros en traer al país las últimas novedades.',
    icon: '🔬',
  },
];

const stats = [
  { value: '10+', label: 'AÑOS DE EXPERIENCIA' },
  { value: '5.000+', label: 'CLIENTES SATISFECHOS' },
  { value: '300+', label: 'MARCAS REPRESENTADAS' },
  { value: '24/7', label: 'SOPORTE AL CLIENTE' },
];

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <div className="bg-[#0d0e10] min-h-screen">
      {/* Hero */}
      <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <img alt="" className="absolute max-w-none object-cover size-full" src={imgHero} />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#ffd400] h-0.5 w-6" />
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase">
              NUESTRA HISTORIA
            </p>
            <div className="bg-[#ffd400] h-0.5 w-6" />
          </div>
          <h1 className="font-['Montserrat'] font-black text-[52px] text-white leading-tight drop-shadow-lg">
            SOBRE BIKE STORE
          </h1>
          <p className="font-['Inter'] font-normal text-white/85 text-[18px] max-w-[600px] leading-[1.65]">
            Más de una década llevando la pasión por el ciclismo a un nivel superior en Colombia y Latinoamérica.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <div className="px-16 py-24">
        <div className="flex gap-20 items-center max-w-[1200px] mx-auto">
          <div className="flex-1">
            <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase mb-3">
              QUIÉNES SOMOS
            </p>
            <h2 className="font-['Montserrat'] font-black text-[36px] text-white mb-6 leading-tight">
              LA TIENDA DE BICICLETAS MÁS COMPLETA DE COLOMBIA
            </h2>
            <div className="flex flex-col gap-4 font-['Inter'] font-normal text-gray-300 text-[15px] leading-[1.75]">
              <p>
                Bike Store nació en 2014 con una misión clara: democratizar el acceso al ciclismo de alto rendimiento en Colombia. Desde nuestras humildes raíces en Medellín, hemos crecido hasta convertirnos en el referente nacional para ciclistas de todos los niveles.
              </p>
              <p>
                Nuestro catálogo incluye las mejores marcas del mundo — Canyon, Trek, Specialized, Giant, Shimano, SRAM y muchas más — con precios competitivos y un servicio de asesoría personalizada que ninguna otra tienda puede igualar.
              </p>
              <p>
                Hoy contamos con tiendas físicas en Bogotá, Medellín y Cali, además de nuestra plataforma digital que entrega a todo el territorio nacional con garantía total de satisfacción.
              </p>
            </div>
          </div>
          <div className="w-[480px] flex-shrink-0">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                <img src={imgBanner} alt="Bike Store" className="size-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#ffd400] p-6 rounded-xl shadow-xl">
                <p className="font-['Montserrat'] font-black text-[32px] text-black leading-none">10+</p>
                <p className="font-['Inter'] font-bold text-black text-[12px]">AÑOS CONTIGO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-black border-y border-[#2c2f36] py-16 px-16">
        <div className="grid grid-cols-4 gap-8 max-w-[1200px] mx-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <p className="font-['Montserrat'] font-black text-[48px] text-[#ffd400] leading-none">{value}</p>
              <p className="font-['Inter'] font-bold text-gray-400 text-[12px] tracking-widest">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="px-16 py-24">
        <div className="text-center mb-16">
          <p className="font-['Inter'] font-extrabold text-[#ffd400] text-[12px] tracking-widest uppercase mb-3">
            LO QUE NOS DEFINE
          </p>
          <h2 className="font-['Montserrat'] font-black text-[36px] text-white">NUESTROS VALORES</h2>
        </div>
        <div className="grid grid-cols-4 gap-6 max-w-[1200px] mx-auto">
          {values.map(({ title, description, icon }) => (
            <div
              key={title}
              className="bg-[#181a1e] border border-[#2c2f36] p-8 flex flex-col gap-4 rounded-2xl hover:border-[#ffd400] transition-colors"
            >
              <div className="text-[32px]">{icon}</div>
              <div className="bg-[#ffd400] h-[3px] w-10 rounded-full" />
              <p className="font-['Montserrat'] font-black text-white text-[16px]">{title}</p>
              <p className="font-['Inter'] font-normal text-gray-400 text-[14px] leading-[1.65]">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#121316] border-t border-[#2c2f36] py-20 px-16 text-center">
        <p className="font-['Montserrat'] font-black text-[32px] text-white mb-4">
          ¿LISTO PARA TU PRÓXIMA AVENTURA?
        </p>
        <p className="font-['Inter'] font-normal text-gray-400 text-[16px] mb-8">
          Explora nuestro catálogo y encuentra la bicicleta perfecta para ti.
        </p>
        <button
          onClick={() => navigate({ page: 'catalog', category: 'all' })}
          className="bg-[#ffd400] px-12 py-5 rounded-xl font-['Montserrat'] font-black text-[14px] text-black hover:bg-[#e6bf00] transition-colors cursor-pointer"
        >
          VER CATÁLOGO COMPLETO
        </button>
      </div>
    </div>
  );
}
