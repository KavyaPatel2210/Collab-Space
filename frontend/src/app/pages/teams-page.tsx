import * as React from "react";
import { Users, Plus, ArrowRight, Crown, UserPlus, FileText } from "lucide-react";
import { Button, Input, Modal, Avatar } from "../components/ui-components";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useTeams } from "../hooks/useTeams";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router";

export function TeamsPage() {
  const { teams, loading, error, createTeam } = useTeams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState("");
  const [newTeamDesc, setNewTeamDesc] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setIsCreating(true);
    try {
      const team = await createTeam(newTeamName, newTeamDesc);
      toast.success("Team created successfully!");
      setIsModalOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
      navigate(`/teams/${team._id}`);
    } catch (err) {
      toast.error("Failed to create team.");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6 max-w-6xl mx-auto">
          <div className="h-10 w-48 bg-gray-200 dark:bg-white/10 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-white/10 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto pb-28 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1E1B4B] dark:text-[#E8E6F0] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Your <span className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">Teams</span>
          </h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-[15px]">
            Collaborate on documents with shared workspaces.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-11 px-5 font-bold">
          <Plus className="mr-2 w-4 h-4" /> New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center glass-panel rounded-3xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-[24px] flex items-center justify-center mb-6 shadow-xl shadow-[#6366F1]/20">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E1B4B] dark:text-[#E8E6F0] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            No teams yet
          </h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-8 max-w-md">
            Create a team to organize shared documents and collaborate with your peers effortlessly.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="h-12 px-8 font-bold">
            <Plus className="mr-2 w-5 h-5" /> Create Your First Team
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, idx) => {
            const isOwner = team.owner?._id === user?.id;
            return (
              <motion.div
                key={team._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/teams/${team._id}`)}
                className="group glass-panel rounded-[20px] p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden glow-border flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#6366F1]/5 to-[#8B5CF6]/5 rounded-bl-full translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B4B] dark:text-[#E8E6F0] line-clamp-1 group-hover:text-indigo-500 transition-colors">{team.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {isOwner && <span className="flex items-center gap-1 text-amber-500"><Crown className="w-3 h-3"/> Owner</span>}
                      <span>•</span>
                      <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 mb-5">
                  {team.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-[rgba(139,92,246,0.08)]">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((m, i) => (
                      <div key={i} className="rounded-full border-2 border-white dark:border-[#0F0D1F]">
                        <Avatar fallback={m.userId?.name?.charAt(0).toUpperCase() || 'U'} size="sm" />
                      </div>
                    ))}
                    {team.members.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0F0D1F] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        +{team.members.length - 4}
                      </div>
                    )}
                  </div>
                  <button className="text-sm font-bold text-[#6366F1] dark:text-[#C4B5FD] flex items-center gap-1 group-hover:underline">
                    Open <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Team">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Name</label>
            <Input 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              placeholder="e.g. Design Team" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
            <textarea
              value={newTeamDesc}
              onChange={e => setNewTeamDesc(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#1E1B4B]/50 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="What is this team for?"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Team</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
