import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ContractStatus from '../../components/ContractStatus';

const ClientContractStatus = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [contract, setContract] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch client data
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!clientResponse.ok) throw new Error('Error al cargar cliente');
      const clientData = await clientResponse.json();
      setClient(clientData);

      // Fetch contract data
      const contractResponse = await fetch(`/api/contracts/client/${clientId}`);
      if (contractResponse.ok) {
        const contractData = await contractResponse.json();
        setContract(contractData.contract);
      }

      // Get current user (simplified - in real app would come from auth context)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const handleRefresh = async () => {
    await fetchData();
  };

  // Check if current user is a signer
  const isUserSigner = contract?.signatures?.some(
    (s) => s.userId === currentUserId || s.signerId === currentUserId
  );

  // Non-signers can only view after completion
  const canViewContract = isUserSigner || contract?.status === 'completed';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Client info header */}
        {client && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {client.legalName || client.denominacion || `${client.firstName} ${client.lastName}`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              CUIT: {client.cuit} | Estado: {client.status}
            </p>
          </div>
        )}

        {/* Contract status component */}
        <ContractStatus
          client={client}
          contract={contract}
          currentUserId={currentUserId}
          onRefresh={handleRefresh}
          canViewContract={canViewContract}
        />

        {/* Additional info for approved clients without contract */}
        {client?.status === 'aprobado' && !contract && (
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Próximos pasos
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>1. El equipo de compliance preparará el contrato</li>
              <li>2. Se notificará a los firmantes cuando esté listo</li>
              <li>3. Cada firmante recibirá un link para firmar</li>
              <li>4. Una vez completadas todas las firmas, el contrato estará disponible</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientContractStatus;
