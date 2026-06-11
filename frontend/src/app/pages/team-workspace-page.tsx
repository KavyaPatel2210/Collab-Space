import * as React from "react";
import { useParams, useNavigate } from "react-router";
import { Users, Plus, FileText, ArrowLeft, Crown, UserPlus, Settings, Trash2, LogOut, Clock, ChevronRight } from "lucide-react";
import { Button, Input, Modal, Avatar, Badge, cn } from "../components/ui-components";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTeams, Team } from "../hooks/useTeams";
import { useAuth } from "../contexts/AuthContext";

export function TeamWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTeamById, getTeamDocuments, createTeamDocument, inviteMember, leaveTeam, loading } = useTeams();
  const { user } = useAuth();

  const [team, setTeam] = React.useState<Team | null>(null);
  const [documents, setDocuments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreatingDoc, setIsCreatingDoc] = React.useState(false);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");
  const [isInviting, setIsInviting] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const t = await getTeamById(id);
        setTeam(t);
        const docs = await getTeamDocuments(id);
        setDocuments(docs);
      } catch (err) {
        toast.error("Failed to load team workspace");
        navigate("/teams");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleCreateDoc = async () => {
    if (!id) return;
    setIsCreatingDoc(true);
    try {
      const doc = await createTeamDocument(id, "Untitled Team Document");
      navigate(`/editor/${doc._id}`);
    } catch (err) {
      toast.error("Failed to create document");
      setIsCreatingDoc(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail) return;
    setIsInviting(true);
    try {
      const updatedTeam = await inviteMember(id, inviteEmail, inviteRole);
      setTeam(updatedTeam);
      toast.success("Member invited successfully");
      setIsInviteModalOpen(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleLeave = async () => {
    if (!id || !confirm("Are you sure you want to leave this team?")) return;
    try {
      await leaveTeam(id);
      toast.success("You have left the team");
      navigate("/teams");
    } catch (err) {
      toast.error("Failed to leave team");
    }
  };

  if (isLoading || !team) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6 max-w-6xl mx-auto flex">
          <div className="flex-1 space-y-4">
            <div className="h-10 w-64 bg-gray-200 dark:bg-white/10 rounded"></div>
            <div className="h-40 bg-gray-200 dark:bg-white/10 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 dark:bg-white/10 rounded-2xl"></div>
          </div>
          <div className="w-72 hidden lg:block ml-8 space-y-4">
            <div className="h-96 bg-gray-200 dark:bg-white/10 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = team.owner?._id === user?.id;
  const userMember = team.members.find(m => m.userId?._id === user?.id);
  const isAdmin = isOwner || userMember?.role === 'admin';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto pb-28 md:pb-8 flex flex-col lg:flex-row gap-8">
      {/* LEFT MAIN AREA */}
      <div className="flex-1 min-w-0">
        <button 
          onClick={() => navigate("/teams")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teams
        </button>

        <div className="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {team.name}
                  </h1>
                  <Badge variant="default" className="mt-1 bg-indigo-100 text-indigo-700 border-indigo-200">
                    <Users className="w-3 h-3 mr-1" /> {team.members.length} Members
                  </Badge>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl">
                {team.description || "Welcome to the team workspace."}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleCreateDoc} isLoading={isCreatingDoc} className="h-12 px-6 shadow-lg shadow-indigo-500/20">
                <Plus className="mr-2 w-5 h-5" /> New Document
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0]" style={{ fontFamily: 'var(--font-heading)' }}>Team Documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="glass-panel rounded-2xl py-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No documents yet</h3>
            <p className="text-gray-500 mt-2">Start collaborating by creating a new document in this workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {documents.map((doc, idx) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/editor/${doc._id}`)}
                className="group cursor-pointer glass-panel rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glow-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-[#1E1B4B] dark:text-[#E8E6F0] mb-1 group-hover:text-indigo-500 transition-colors truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated recently</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 text-[#1E1B4B] dark:text-[#E8E6F0]">
              <Users className="w-5 h-5 text-indigo-500" /> Members
            </h3>
            {isAdmin && (
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 rounded-lg transition-colors"
                title="Invite Member"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {team.members.map((member) => {
              const isMemOwner = member.userId?._id === team.owner._id;
              return (
                <div key={member.userId?._id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar fallback={member.userId?.name?.charAt(0).toUpperCase() || 'U'} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {member.userId?.name} {member.userId?._id === user?.id && "(You)"}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{member.userId?.email}</p>
                    </div>
                  </div>
                  <div>
                    {isMemOwner ? (
                      <Badge variant="warning" className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 px-1.5">Owner</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px] px-1.5">{member.role}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <h3 className="font-bold flex items-center gap-2 text-[#1E1B4B] dark:text-[#E8E6F0] mb-4">
            <Settings className="w-5 h-5 text-gray-500" /> Settings
          </h3>
          <div className="space-y-2">
            {!isOwner && (
              <button 
                onClick={handleLeave}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Leave Team
              </button>
            )}
            {isOwner && (
              <button 
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm transition-colors opacity-50 cursor-not-allowed"
                title="Only available via API for now"
              >
                <Trash2 className="w-4 h-4" /> Delete Team
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite to Team">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Email</label>
            <Input 
              type="email" 
              placeholder="collaborator@example.com" 
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select 
              className="w-full bg-gray-50 dark:bg-[#1E1B4B]/50 border border-gray-200 dark:border-white/10 rounded-xl h-11 px-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isInviting}>Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
