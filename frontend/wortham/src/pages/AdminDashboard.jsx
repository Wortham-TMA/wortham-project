import '../assets/css/dashboard.css';
import logo from '../assets/images/logo.avif'
import { RxExit } from "react-icons/rx";
import { GoPlusCircle, GoPlus } from "react-icons/go";
import { CiEdit } from "react-icons/ci";
import { useState } from 'react';
import { Dashboard } from './Dashboard';
import { AllInvoices } from './AllInvoices';
import { Projects } from './Projects';
import { Team } from './Team';
import { Clients } from './Clients';
import { Tasks } from './Tasks';
import { Settings } from './Settings';
import { CiCalendar } from "react-icons/ci";
import { PiStackLight } from "react-icons/pi";

export const AdminDashboard = () => {

    const [selectedClientId, setSelectedClientId] = useState("");



    const [activeSection, setActiveSection] = useState("dashboard")

    const renderContent = () => {
        switch (activeSection) {
            case "dashboard":
                return <Dashboard/>;

            case "invoices":
                return <AllInvoices/>;

            case "projects":
                return <Projects/>;

            case "team":
                return <Team/>;        // yahan create team form aayega

            case "clients":
                return <Clients/>;     // yahan create client form aayega

            case "tasks":
                return <Tasks/>;

            case "settings":
                return <Settings/>;

            default:
                return <Dashboard/>;
        }
    }

    return<>

        <div className="admin-dashboard-main">
            <div className="inside-admin-dashboard-main">
                <div className="inner-admin-dashboard-main iadm">

                    <div className="inner-admin-side-nav iasn">
                        <img src={logo} alt="" className="logo" />
                        <h2>WORTHAM</h2>
                    </div>
                    <div className="inner-admin-side-nav dsp">
                        <div className="side-menu-links">
                            <p onClick={()=>setActiveSection("dashboard")}>Dashboard</p>
                            <p onClick={()=>setActiveSection("invoices")}>All Invoices</p>
                            <p onClick={()=>setActiveSection("projects")}>Projects</p>
                            <p onClick={()=>setActiveSection("team")}>Team</p>
                            <p onClick={()=>setActiveSection("clients")}>Clients</p>
                            <p onClick={()=>setActiveSection("tasks")}>Tasks</p>
                            <p onClick={()=>setActiveSection("settings")}>Settings</p>
                        </div>


                        <div className="sign-out">
                            <RxExit />
                            <p>Sign Out</p>
                        </div>


                    </div>

                </div>
                <div className="inner-admin-dashboard-main">
                    <div className="upper-iadm">
                        <h1>Admin Portal</h1>
                    </div>

                    {renderContent()}

             


                </div>
            </div>
        </div>

    </>


}