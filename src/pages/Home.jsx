import Hero from '../components/Hero';
import LoginForm from '../components/LoginForm';
import '../App.css';

export default function Home() {
  return (
    <main className="main">
      <Hero />
      <LoginForm />
    </main>
  );
}
