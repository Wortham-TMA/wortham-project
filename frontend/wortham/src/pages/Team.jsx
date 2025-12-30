import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci"
import { GoPlus } from "react-icons/go"
import { IoIosClose } from "react-icons/io";

export const Team = () => {

    const [showForm, setShowForm] = useState(false);


    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [designation, setDesignation] = useState("");
    const [loading, setLoading] = useState(false);



    const [members, setMembers] = useState([]);
    const [loadingList, setLoadingList] = useState(false);


    const createTeam = async(e) => {


        e.preventDefault();
        setMsg("");
        setLoading(true);


        try{


                const token = localStorage.getItem("token");

                const res = await fetch("http://localhost:5000/api/admin/create-team", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name,
                    email,
                    password,
                    designation
                  }),
                });


      const data = await res.json();
      console.log("CREATE TEAM RESP:", data);

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create team member");
      }

      setMsg(`Team member created:`);

      // form reset
      setName("");
      setEmail("");
      setPassword("");
      setDesignation("");

      // yahan baad me team list refresh bhi kara sakte ho
      // fetchTeam();
    } catch (err) {
      setMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
    }


    const fetchTeam = async () => {
  try {
    setLoadingList(true);
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/admin/teams", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log("TEAM LIST RESP:", data);

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Failed to load team");
    }

    setMembers(data.teams || []);
  } catch (err) {
    console.error(err);
    setMsg(err.message || "Failed to load team");
  } finally {
    setLoadingList(false);
  }
};

useEffect(() => {
  fetchTeam();
}, []);


    return<>
        

         <div className="inside-admin-dashboard-team">

                        {
                                            showForm && (
                                                <div className="inside-admin-main-form ter">
                                        <form onSubmit={createTeam}>
                        
                                            <h2>Team Form</h2>
                        
                                            <input type="text" value={name} onChange={(e)=> setName(e.target.value)} placeholder='Name'  />
                                            <input type="text" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='Email'/>
                                            <input type="text" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='Password'/>
                                            <input type="text" value={designation} onChange={(e)=>setDesignation(e.target.value)} placeholder='Designation'/>
                        
                                            <button type="submit" className="addClient">
                                                Create
                                            </button>
                        
                                                    <IoIosClose onClick={()=>setShowForm(false)} className="closeForm"/>
                        
                                                
                                            {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
                        
                                        </form>
                                    </div>
                                            )
                                        }



                        { loadingList ? (
                            <p>Loading Team...</p>
                        ) : members.length  === 0 ? (
                            <p>No Team Members</p>
                        ) : (

                            members.map((m)=>(
                                <div className="team-member-card">
                                    <div className="inner-team-member-card itmc"></div>
                                    <div className="inner-team-member-card">
                                        <span className="text">
                                            <h3>{m.name}</h3>
                                            <p>{m.designation}</p>
                                        </span>
                                        <CiEdit className='edit' />
                                    </div>
                                </div>
                            ))

                        )}

        
                        
        
                        <div className="create-member-card" onClick={()=>setShowForm(true)}>
                            <h3 className='dfg'><GoPlus className='goPlus' /> Add Team Member</h3>
                        </div>
        
        
                    </div>


    </>
}