import { RxExit } from 'react-icons/rx';
import '../assets/css/dashboard.css';
import logo from '../assets/images/logo.avif'
import { TeamTask } from './TeamTask';

export const TeamDashboard = () => {
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
                                    <p >My Tasks</p>
                                </div>
        
        
                                <div className="sign-out">
                                    <RxExit />
                                    <p>Sign Out</p>
                                </div>
        
        
                            </div>
        
                        </div>
                        <div className="inner-admin-dashboard-main">
                            <div className="upper-iadm">
                                <h1>Team Portal</h1>
                            </div>
        
        
                            <TeamTask/> 
        
        
                        </div>
                    </div>
                </div>



    </>
}