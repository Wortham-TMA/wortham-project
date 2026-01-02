import { GoPlusCircle } from "react-icons/go"
import { useEffect, useState } from "react"
import { IoIosClose } from "react-icons/io";

export const Clients = () => {

    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";



    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [folderId, setFolderId] = useState("");
    const [credits, setCredits] = useState("");
    const [clientType, setClientType] = useState("");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);


    const [clients, setClients] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const fetchClients = async () => {
  try {
    setLoadingList(true);
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/admin/clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Failed to load clients");
    }

    setClients(data.clients);
  } catch (err) {
    console.error(err);
    setMsg(err.message || "Failed to load clients");
  } finally {
    setLoadingList(false);
  }
};


useEffect(() => {
  fetchClients();
}, []);




    const handleCreateClient = async (e) => {
        e.preventDefault();
        setMsg("");
        setLoading(true);

        try{
            const token = localStorage.getItem("token");

            const res = await fetch(`${API}/api/admin/create-client`,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:`Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    email,
                    companyName: company,
                    clientType: clientType,
                    googleDriveFolderId: folderId,
                    creditBalance: credits ? Number(credits):0 //number me convert
                }),
            });


            const data = await res.json();
            console.log("CREATE CLIENT RESPONSE:", data);


            if(!res.ok || !data.ok){
                throw new Error(data.error || "Failed to create client");
            }

            setMsg(`Client created:`);
      // form reset
      setName("");
      setEmail("");
      setCompany("");
      setFolderId("");
      setCredits("");
       setClientType("");
            
      fetchClients();


        }catch (err) {
      setMsg(err.message || "Something went wrong");
    }finally {
      setLoading(false);
    }
    };

    return<>
        

             <div className="inside-admin-dashboard-clients">
                <div className="inner-admin-dashboard-clients iadc">


                    <input type="text" placeholder='Client Name' />
                     <button className="primary pl" onClick={()=>setShowForm(true)}>
                            <GoPlusCircle className='plus'/> Add New Client
                    </button>


                </div>


                {
                    showForm && (
                        <div className="inside-admin-main-form">
                <form onSubmit={handleCreateClient}>

                    <h2>Client Form</h2>

                    <input type="text" placeholder='Name' value={name} onChange={(e)=> setName(e.target.value)}/>
                    <input type="text" placeholder='Email' value={email} onChange={(e)=> setEmail(e.target.value)}/>
                    <input type="text" placeholder='Company Name' value={company} onChange={(e)=> setCompany(e.target.value)}/>
                    <input type="text" placeholder='Client Type' value={clientType} onChange={(e)=> setClientType(e.target.value)}/>
                    <input type="text" placeholder='Google Drive Folder ID' value={folderId} onChange={(e)=> setFolderId(e.target.value)}/>
                    <input type="text" placeholder='Credit Balance' value={credits} onChange={(e)=> setCredits(e.target.value)}/>


                    <button className="addClient">
                        Create
                    </button>

                            <IoIosClose onClick={()=>setShowForm(false)} className="closeForm"/>

                        
                    {msg && <p style={{ marginTop: 8 }}>{msg}</p>}

                </form>
            </div>
                    )
                }


                <div className="inner-admin-dashboard-clients ">

                    <div className="admin-client-list rty">

                        <div className="admin-client-list-head">

                            <div className="inner-admin-client-list-head">
                                <h3>Client</h3>
                            </div>
                            <div className="inner-admin-client-list-head">
                                <h3>Type</h3>
                            </div>
                            <div className="inner-admin-client-list-head">
                                <h3>Status</h3>
                            </div>

                        </div>

                        {
                            clients.map((c)=>{

                                const {name, email, companyName, googleDriveFolderId, creditBalance, isActive} = c;

                                console.log(isActive);


                                return<>
                                    <div className="admin-client-list-body">
                                        <div className="inner-admin-client-list-body">
                                            <p className='admin-client-name'>{companyName}</p>
                                            <p className='admin-client-email'>{email}</p>
                                        </div>
                                        <div className="inner-admin-client-list-body">
                                            <p className='admin-client-type'>{c.clientType}</p>
                                        </div>
                                        <div className="inner-admin-client-list-body">
                                            <p>{isActive ? "Active" : "Inactive"}</p>
                                        </div>
                                    </div>
                                </>

                                
                            })
                        }

                        
                       



                    </div>

                </div>
            </div>


    </>
}