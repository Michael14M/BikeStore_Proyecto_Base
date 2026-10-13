import type { NavigationState } from '../types';

const imgBrandLogo = '/assets/44336.png';
const imgArrowRight1 = '/assets/d2c0a.svg';
const imgInstagram = '/assets/bcf94.svg';
const imgFacebook = '/assets/b7a0f.svg';
const imgYoutube = '/assets/a62bb.svg';
const imgTwitter = '/assets/39cd7.svg';
const imgCreditCard = '/assets/ae52a.svg';
const imgApple = '/assets/e70d8.svg';
const imgShare2 = '/assets/5f40b.svg';

interface FooterProps {
  navigate: (state: NavigationState) => void;
}

export default function Footer({ navigate }: FooterProps) {
  return (
    <footer className="bg-black flex flex-col gap-16 items-start pb-10 pt-20 px-16 w-full">
      <div className="flex items-start justify-between w-full gap-8 flex-wrap">
        <div className="flex flex-col gap-6 items-start w-[320px]">
          <button onClick={() => navigate({ page: 'home' })} className="h-[100px] w-[140px] relative cursor-pointer">
            <img alt="Bike Store" className="absolute inset-0 size-full object-cover" src={imgBrandLogo} />
          </button>
          <p className="font-['Inter'] font-normal leading-[1.6] text-[#888c94] text-[14px]">
            La marca preferida de los ciclistas profesionales y entusiastas del alto rendimiento. Innovación, tecnología y velocidad en cada pedalada.
          </p>
        </div>

        <div className="flex flex-col gap-5 items-start w-[200px]">
          <p className="font-['Montserrat'] font-extrabold text-white text-[14px]">TIENDA</p>
          <div className="flex flex-col font-['Inter'] font-normal gap-3 items-start text-[#888c94] text-[14px]">
            {[
              { label: 'Bicicletas', action: () => navigate({ page: 'catalog', category: 'all' }) },
              { label: 'Accesorios', action: () => navigate({ page: 'catalog', category: 'accesorios' }) },
              { label: 'Ropa', action: () => navigate({ page: 'catalog', category: 'all' }) },
              { label: 'Componentes', action: () => navigate({ page: 'catalog', category: 'all' }) },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="hover:text-[#ffd400] transition-colors cursor-pointer">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 items-start w-[200px]">
          <p className="font-['Montserrat'] font-extrabold text-white text-[14px]">INFORMACIÓN</p>
          <div className="flex flex-col font-['Inter'] font-normal gap-3 items-start text-[#888c94] text-[14px]">
            {[
              { label: 'Sobre Nosotros', action: () => navigate({ page: 'about' }) },
              { label: 'Envíos', action: () => {} },
              { label: 'Devoluciones', action: () => {} },
              { label: 'Contacto', action: () => {} },
            ].map(({ label, action }) => (
              <button key={label} onClick={action} className="hover:text-[#ffd400] transition-colors cursor-pointer">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6 items-start w-[240px]">
          <div className="flex flex-col gap-4 items-start">
            <p className="font-['Montserrat'] font-extrabold text-white text-[14px]">SÍGUENOS</p>
            <div className="flex gap-4 items-start">
              {[imgInstagram, imgFacebook, imgYoutube, imgTwitter].map((src, i) => (
                <button
                  key={i}
                  className="bg-[#181a1e] border border-[#2c2f36] flex flex-col items-center justify-center size-10 hover:border-[#ffd400] transition-colors cursor-pointer"
                >
                  <div className="size-4 relative">
                    <img alt="" className="absolute inset-0 size-full block" src={src} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 items-start">
            <p className="font-['Montserrat'] font-bold text-white text-[12px]">MÉTODOS DE PAGO</p>
            <div className="flex gap-2 items-start">
              {[imgCreditCard, imgCreditCard, imgApple, imgShare2].map((src, i) => (
                <div key={i} className="bg-[#181a1e] border border-[#2c2f36] flex flex-col h-7 items-center justify-center w-12">
                  <div className="h-4 w-6 relative">
                    <img alt="" className="absolute inset-0 size-full block" src={src} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 items-start w-full">
        <div className="bg-[#2c2f36] h-px w-full" />
        <div className="flex font-['Inter'] font-normal items-center justify-between text-[#888c94] text-[12px] w-full">
          <p>© 2024 BIKE STORE. Todos los derechos reservados.</p>
          <div className="flex gap-6 items-start">
            <button className="hover:text-[#ffd400] transition-colors cursor-pointer">Política de Privacidad</button>
            <button className="hover:text-[#ffd400] transition-colors cursor-pointer">Términos y Condiciones</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
