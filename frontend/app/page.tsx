import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="home">
      <header className="header wrap">
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span> paint
          <span className="brand-dot">.</span>
        </Link>
        <nav>
          <Link className="nav-login" href="/login">
            Iniciar sesión
          </Link>
          <Button render={<Link href="/register" />} nativeButton={false} className="button button-dark button-small">
            Crear cuenta <span>↗</span>
          </Button>
        </nav>
      </header>
      <section className="hero wrap">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> TU ESPACIO PARA CREAR
          </div>
          <h1>
            Las buenas ideas
            <br />
            <em>empiezan aquí.</em>
          </h1>
          <p>
            Un espacio en blanco, infinitas posibilidades. Entra a tu cuenta y
            dale forma a lo que imaginas.
          </p>
          <div className="hero-actions">
            <Button render={<Link href="/register" />} nativeButton={false} className="button button-dark">
              Comenzar ahora <span>↗</span>
            </Button>
            <Link className="text-link" href="/login">
              Ya tengo una cuenta <span>→</span>
            </Link>
          </div>
          <div className="hero-note">
            <span>✳</span> HECHO PARA TUS PRÓXIMAS IDEAS
          </div>
        </div>
        <div
          className="artboard"
          aria-label="Composición abstracta de formas y colores"
        >
          <div className="art-top">
            <span>UNA NUEVA IDEA</span>
            <span>✳ &nbsp; 001 / ∞</span>
          </div>
          <div className="art-shape shape-peach" />
          <div className="art-shape shape-lime" />
          <div className="art-shape shape-purple" />
          <div className="art-shape shape-blue" />
          <div className="art-shape shape-orange" />
          <div className="art-stamp">
            hazlo
            <br />
            <i>tuyo.</i>
            <span>✳</span>
          </div>
          <div className="art-bottom">
            <span>UN POCO DE INSPIRACIÓN</span>
            <span>↗</span>
          </div>
        </div>
      </section>
      <footer className="footer wrap">
        <span>© PAINT STUDIO</span>
        <span>
          UN LUGAR PARA EMPEZAR <b>✳</b>
        </span>
        <span>HECHO CON CREATIVIDAD</span>
      </footer>
    </main>
  );
}
