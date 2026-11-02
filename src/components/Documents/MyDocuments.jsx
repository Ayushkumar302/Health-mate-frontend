import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { DocumentList, UploadDocument } from "./Documents";

// the logged-in person's own files: medical reports (patients) or verification documents (doctors)
const MyDocuments = ({ icon, title, subtitle, note, categories, withDate = false, empty }) => {
  const { token } = useContext(authContext);
  const [documents, setDocuments] = useState(null);

  useEffect(() => {
    apiRequest("/documents/mine", { token })
      .then(result => setDocuments(result.data))
      .catch(error => {
        toast.error(error.message);
        setDocuments([]);
      });
  }, [token]);

  return (
    <SectionCard icon={icon} title={title} subtitle={subtitle}>
      {note && <p className="mb-4 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{note}</p>}
      <UploadDocument categories={categories} withDate={withDate} onUploaded={document => setDocuments(list => [document, ...(list || [])])} />
      <div className="mt-5">
        {!documents ? (
          <div className="skeleton h-16 rounded-xl" />
        ) : (
          <DocumentList
            documents={documents}
            canDelete
            empty={empty}
            onDeleted={id => setDocuments(list => list.filter(item => item._id !== id))}
          />
        )}
      </div>
    </SectionCard>
  );
};

export default MyDocuments;
