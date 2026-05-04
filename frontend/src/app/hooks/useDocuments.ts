import * as React from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useAuth } from "../contexts/AuthContext";

export interface CollabDocument {
    _id: string;
    id: string;
    title: string;
    content: string;
    owner: any;
    collaborators: {
        userId: { _id: string; name: string; email: string; };
        role: "owner" | "editor" | "viewer";
    }[];
    createdAt: string;
    updatedAt: string;
}

export function useDocuments() {
    const { user } = useAuth();
    const [documents, setDocuments] = React.useState<CollabDocument[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!user) {
            setDocuments([]);
            setLoading(false);
            return;
        }

        const fetchDocs = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/documents`);
                const mappedDocs = res.data.map((doc: any) => ({
                    ...doc,
                    id: doc._id
                }));
                setDocuments(mappedDocs);
            } catch (err) {
                console.error("Error fetching documents:", err);
                setError("Failed to load documents");
            } finally {
                setLoading(false);
            }
        };

        fetchDocs();
    }, [user]);

    const ownedDocuments = documents.filter(doc => {
        if (!doc.owner) return false;
        const ownerId = typeof doc.owner === 'string' ? doc.owner : doc.owner._id;
        return ownerId === user?.id;
    });
    const sharedDocuments = documents.filter(doc => {
        if (!doc.owner) return false;
        const ownerId = typeof doc.owner === 'string' ? doc.owner : doc.owner._id;
        return ownerId !== user?.id;
    });

    const createDocument = async (title: string): Promise<string> => {
        if (!user) throw new Error("User must be authenticated");

        const res = await axios.post(`${API_URL}/api/documents`, {
            title: title.trim(),
            content: ""
        });

        return res.data._id;
    };

    return { documents, ownedDocuments, sharedDocuments, loading, error, createDocument, setDocuments };
}
