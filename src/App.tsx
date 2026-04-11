import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return <div className="p-4 text-center text-gray-500">sdk-example</div>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
