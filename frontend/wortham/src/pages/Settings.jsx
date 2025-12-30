import { GoPlusCircle } from "react-icons/go"

export const Settings = () => {
    return<>
        
        <div className="inside-admin-dashboard-clients">
                        <div className="inner-admin-dashboard-clients iadc">
        
        
                            <input type="text" placeholder='Global Banner Message' />
                             <button className="primary pl">
                                    <GoPlusCircle className='plus'/> Update Text
                            </button>
        
        
                        </div>
                        <div className="inner-admin-dashboard-clients iadc">
        
        
                            <input type="text" placeholder='Banner Image URL' />
                             <button className="primary pl">
                                    <GoPlusCircle className='plus'/> Update Image
                            </button>
                            
        
        
                        </div>
                       
                    </div>


    </>
}