import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import WindData from "./WindData.tsx";

function App() {
    return <div className="px-6 max-w-[400px] pt-16 h-screen mx-auto flex flex-col justify-between space-y-8">
        <Header/>
        <WindData/>
        <Footer/>
    </div>
}

export default App;