import { Provider } from "react-redux";
import { store } from "@redux/store";
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { Router } from "@routers/Routers";
import { AuthProvider } from "@context/AuthContext";
import { NotificationProvider } from "@context/NotificationContext";
import NotificationContainer from "@components/common/NotificationContainer";

function App() {
	return (
		<Provider store={store}>
			<AuthProvider>
				<NotificationProvider>
					<Suspense fallback={<Loading />}>
						<RouterProvider router={Router} />
					</Suspense>
					<NotificationContainer />
				</NotificationProvider>
			</AuthProvider>
		</Provider>
	);
}

export default App;

const Loading = () => (
	<div className="flex items-center justify-center min-h-screen">
		<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
	</div>
);
