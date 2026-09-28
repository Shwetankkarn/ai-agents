import { lazy, Suspense } from "react";

const App = lazy(() => import("./App.jsx"));

function AppLoader() {
    return (
        <Suspense fallback={<div className="auth-loading"><span>✳</span>Preparing your workspace…</div>}>
            <App />
        </Suspense>
    );
}

export default AppLoader;
