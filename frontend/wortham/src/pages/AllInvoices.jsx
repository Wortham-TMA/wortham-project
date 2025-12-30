import { GoPlusCircle } from "react-icons/go"

export const AllInvoices = () => {
    return<>


         <div className="inside-admin-dashboard-invoice">
                        <button className="primary">
                            <GoPlusCircle className='plus'/> Create New Invoice
                        </button>
        
                        <div className="inner-admin-dashboard-invoice">
                            <h3>All Invoices</h3>
                            <div className="admin-invoice-head">
                                <div className="inner-admin-invoice-head">
                                    <h4>Invoice ID</h4>
                                </div>
                                <div className="inner-admin-invoice-head">
                                    <h4>Client</h4>
                                </div>
                                <div className="inner-admin-invoice-head">
                                    <h4>Date</h4>
                                </div>
                                <div className="inner-admin-invoice-head">
                                    <h4>Amount</h4>
                                </div>
                                <div className="inner-admin-invoice-head">
                                    <h4>Status</h4>
                                </div>
                            </div>
        
                            <div className="admin-invoice-body">
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-name'>INV-2024-001</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='client-name'>Acme Corp</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-date'>2023-10-25</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-amount'>$2,500.00</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p>Paid</p>
                                </div>
                            </div>
                             <div className="admin-invoice-body">
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-name'>INV-2024-001</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='client-name'>Acme Corp</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-date'>2023-10-25</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-amount'>$2,500.00</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p>Paid</p>
                                </div>
                            </div>
                             <div className="admin-invoice-body">
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-name'>INV-2024-001</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='client-name'>Acme Corp</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-date'>2023-10-25</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p className='invoice-amount'>$2,500.00</p>
                                </div>
                                <div className="inner-admin-invoide-body">
                                    <p>Paid</p>
                                </div>
                            </div>
        
                        </div>
        
                    </div>



    </>
}