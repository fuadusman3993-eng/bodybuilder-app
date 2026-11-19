import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingCoachApplication } from '../../lib/ceoUserService';

interface CeoCoachesDashboardProps {
  coaches: PendingCoachApplication[];
  onReviewCoach: (coachUid: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  onInspectDocument: (url: string, title: string) => void;
  reviewingCoachUid: string | null;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function CeoCoachesDashboard({
  coaches,
  onReviewCoach,
  onInspectDocument,
  reviewingCoachUid,
  onRefresh,
  refreshing,
}: CeoCoachesDashboardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [domainFilter, setDomainFilter] = useState<'all' | 'Fitness' | 'Football' | 'Health'>('all');

  // Rejection Modal State
  const [rejectModalCoach, setRejectModalCoach] = useState<PendingCoachApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Quick rejection presets
  const rejectionPresets = [
    'License or diploma image is unreadable / blurry.',
    'National ID card front/back is missing.',
    'Certification has expired or cannot be verified with the sports federation.',
    'First Aid certification is required for this coaching domain.',
    'Incomplete profile details (pricing or coaching bio).',
  ];

  // Derived Counts
  const pendingCount = useMemo(() => {
    return coaches.filter(
      (c) => c.verification_status === 'pending_review' || (!c.is_verified && c.verification_status !== 'rejected')
    ).length;
  }, [coaches]);

  const approvedCount = useMemo(() => {
    return coaches.filter((c) => c.verification_status === 'approved' || c.is_verified).length;
  }, [coaches]);

  const rejectedCount = useMemo(() => {
    return coaches.filter((c) => c.verification_status === 'rejected').length;
  }, [coaches]);

  // Filtered List
  const filteredCoaches = useMemo(() => {
    return coaches.filter((c) => {
      // Status filtering
      const isPending = c.verification_status === 'pending_review' || (!c.is_verified && c.verification_status !== 'rejected');
      const isApproved = c.verification_status === 'approved' || c.is_verified;
      const isRejected = c.verification_status === 'rejected';

      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'approved' && !isApproved) return false;
      if (statusFilter === 'rejected' && !isRejected) return false;

      // Domain filtering
      if (domainFilter !== 'all' && c.domain !== domainFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesTelegram = c.telegram?.toLowerCase().includes(q);
        const matchesInstitution = c.institution_name?.toLowerCase().includes(q);
        const matchesLicense = c.license_number?.toLowerCase().includes(q);
        const matchesSpecialty = c.specialty?.some((s) => s.toLowerCase().includes(q));

        return matchesName || matchesPhone || matchesTelegram || matchesInstitution || matchesLicense || matchesSpecialty;
      }

      return true;
    });
  }, [coaches, statusFilter, domainFilter, searchQuery]);

  const handleConfirmReject = async () => {
    if (!rejectModalCoach) return;
    const reason = rejectionReason.trim() || 'Coaching credentials require correction.';
    setIsSubmittingReject(true);
    try {
      await onReviewCoach(rejectModalCoach.uid, 'reject', reason);
      setRejectModalCoach(null);
      setRejectionReason('');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="shield-checkmark" size={26} color="#F59E0B" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={styles.headerTitle}>Coach Verification & Athlete Safety Board</Text>
              {pendingCount > 0 && (
                <View style={styles.pendingBadgeHeader}>
                  <Text style={styles.pendingBadgeHeaderText}>{pendingCount} PENDING</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>
              Strict verification gate: inspect coaching diplomas, national IDs & licenses before coaches can train athletes.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          activeOpacity={0.7}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#00E676" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#CBD5E1" />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── KPI METRICS BAR ── */}
      <View style={[styles.kpiGrid, !isDesktop && styles.kpiGridMobile]}>
        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'pending' && styles.kpiCardActiveOrange]}
          onPress={() => setStatusFilter('pending')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiCardInner}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{pendingCount}</Text>
              <Text style={styles.kpiLabel}>Pending Review</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'approved' && styles.kpiCardActiveGreen]}
          onPress={() => setStatusFilter('approved')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiCardInner}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#00E676" />
            </View>
            <View>
              <Text style={[styles.kpiValue, { color: '#00E676' }]}>{approvedCount}</Text>
              <Text style={styles.kpiLabel}>Verified & Active</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'rejected' && styles.kpiCardActiveRed]}
          onPress={() => setStatusFilter('rejected')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiCardInner}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </View>
            <View>
              <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{rejectedCount}</Text>
              <Text style={styles.kpiLabel}>Rejected / Needs Fix</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, statusFilter === 'all' && styles.kpiCardActiveBlue]}
          onPress={() => setStatusFilter('all')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiCardInner}>
            <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Ionicons name="people" size={20} color="#38BDF8" />
            </View>
            <View>
              <Text style={[styles.kpiValue, { color: '#38BDF8' }]}>{coaches.length}</Text>
              <Text style={styles.kpiLabel}>Total Applications</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <View style={styles.filterSection}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8A95A5" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by coach name, phone, club, license..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8A95A5" />
            </TouchableOpacity>
          )}
        </View>

        {/* Domain Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.domainFilterRow}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {[
            { key: 'all', label: 'All Domains' },
            { key: 'Football', label: '⚽ Football / Soccer' },
            { key: 'Fitness', label: '🏋️ Fitness & Bodybuilding' },
            { key: 'Health', label: '🩺 Health & Wellness' },
          ].map((d) => {
            const active = domainFilter === d.key;
            return (
              <TouchableOpacity
                key={d.key}
                style={[styles.domainPill, active && styles.domainPillActive]}
                onPress={() => setDomainFilter(d.key as any)}
                activeOpacity={0.75}
              >
                <Text style={[styles.domainPillText, active && styles.domainPillTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── COACH APPLICATIONS LIST ── */}
      <View style={styles.listContainer}>
        {filteredCoaches.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="shield-checkmark-outline" size={42} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>No Coaches Found</Text>
            <Text style={styles.emptySub}>
              {statusFilter === 'pending'
                ? '🎉 Zero pending coach applications! All submitted credentials have been verified.'
                : 'No coach profiles match the current filter criteria.'}
            </Text>
            {statusFilter !== 'all' && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setStatusFilter('all');
                  setDomainFilter('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetFilterBtnText}>Show All Coaches</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCoaches.map((coach) => {
            const isPending =
              coach.verification_status === 'pending_review' ||
              (!coach.is_verified && coach.verification_status !== 'rejected');
            const isApproved = coach.verification_status === 'approved' || coach.is_verified;
            const isRejected = coach.verification_status === 'rejected';

            const domainBg =
              coach.domain === 'Football'
                ? '#1E3A8A'
                : coach.domain === 'Health'
                ? '#78350F'
                : '#064E3B';
            const domainColor =
              coach.domain === 'Football'
                ? '#60A5FA'
                : coach.domain === 'Health'
                ? '#FBBF24'
                : '#34D399';

            return (
              <View key={coach.uid} style={styles.coachCard}>
                {/* Top Section */}
                <View style={styles.coachCardTop}>
                  <Image
                    source={{
                      uri:
                        coach.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          coach.name || 'Coach'
                        )}&background=10B981&color=fff&size=120`,
                    }}
                    style={styles.coachAvatar}
                  />

                  <View style={styles.coachInfoWrap}>
                    <View style={styles.coachTitleRow}>
                      <Text style={styles.coachName}>{coach.name}</Text>
                      {/* Status Badge */}
                      {isPending && (
                        <View style={styles.pendingBadge}>
                          <Ionicons name="time" size={12} color="#F59E0B" />
                          <Text style={styles.pendingBadgeText}>Pending Verification</Text>
                        </View>
                      )}
                      {isApproved && (
                        <View style={styles.approvedBadge}>
                          <Ionicons name="shield-checkmark" size={12} color="#00E676" />
                          <Text style={styles.approvedBadgeText}>Verified Coach</Text>
                        </View>
                      )}
                      {isRejected && (
                        <View style={styles.rejectedBadge}>
                          <Ionicons name="close-circle" size={12} color="#EF4444" />
                          <Text style={styles.rejectedBadgeText}>Rejected</Text>
                        </View>
                      )}
                    </View>

                    {/* Domain & Affiliation */}
                    <View style={styles.domainRow}>
                      <View style={[styles.domainTag, { backgroundColor: domainBg }]}>
                        <Text style={[styles.domainTagText, { color: domainColor }]}>
                          {coach.domain || 'Fitness'}
                        </Text>
                      </View>
                      <Text style={styles.affiliationText}>
                        🏢 {coach.institution_name || 'Independent / Private'}
                      </Text>
                      {coach.license_number && (
                        <Text style={styles.licenseNumberText}>
                          • License #{coach.license_number}
                        </Text>
                      )}
                    </View>

                    {/* Key Stats: Experience & Monthly Price */}
                    <View style={styles.statsRow}>
                      <View style={styles.statMiniItem}>
                        <Text style={styles.statMiniLabel}>Experience:</Text>
                        <Text style={styles.statMiniVal}>
                          {coach.experience_years ? `${coach.experience_years} Years` : '3+ Years'}
                        </Text>
                      </View>
                      <View style={styles.statMiniDivider} />
                      <View style={styles.statMiniItem}>
                        <Text style={styles.statMiniLabel}>Monthly Fee:</Text>
                        <Text style={[styles.statMiniVal, { color: '#00E676' }]}>
                          {coach.price_per_month ? `${coach.price_per_month.toLocaleString()} ETB` : 'Free'}
                        </Text>
                      </View>
                      <View style={styles.statMiniDivider} />
                      <View style={styles.statMiniItem}>
                        <Text style={styles.statMiniLabel}>First Aid:</Text>
                        <Text
                          style={[
                            styles.statMiniVal,
                            { color: coach.has_first_aid ? '#00E676' : '#94A3B8' },
                          ]}
                        >
                          {coach.has_first_aid ? '✅ Certified' : '⚠️ None'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Specialties Tags */}
                {coach.specialty && coach.specialty.length > 0 && (
                  <View style={styles.specialtiesWrap}>
                    {coach.specialty.map((spec, idx) => (
                      <View key={idx} style={styles.specChip}>
                        <Text style={styles.specChipText}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bio / Philosophy */}
                {coach.bio && (
                  <View style={styles.bioBox}>
                    <Text style={styles.bioText} numberOfLines={3}>
                      "{coach.bio}"
                    </Text>
                  </View>
                )}

                {/* Rejection Notice if rejected */}
                {isRejected && coach.rejection_reason && (
                  <View style={styles.rejectionNotice}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.rejectionNoticeText}>
                      Rejection Reason: {coach.rejection_reason}
                    </Text>
                  </View>
                )}

                {/* Contact Links */}
                <View style={styles.contactRow}>
                  {coach.phone && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => Linking.openURL(`tel:${coach.phone}`).catch(() => {})}
                    >
                      <Ionicons name="call" size={14} color="#00E676" />
                      <Text style={styles.contactChipText}>{coach.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {coach.telegram && (
                    <TouchableOpacity
                      style={styles.contactChip}
                      onPress={() => {
                        const clean = coach.telegram!.replace('@', '');
                        Linking.openURL(`https://t.me/${clean}`).catch(() => {});
                      }}
                    >
                      <Ionicons name="paper-plane" size={14} color="#38BDF8" />
                      <Text style={[styles.contactChipText, { color: '#38BDF8' }]}>
                        {coach.telegram}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Document Inspection & Actions Deck */}
                <View style={styles.cardFooter}>
                  {/* Left: Document Inspection Buttons */}
                  <View style={styles.docDeck}>
                    {coach.certificate_url ? (
                      <TouchableOpacity
                        style={styles.docInspectBtn}
                        onPress={() =>
                          onInspectDocument(
                            coach.certificate_url!,
                            `${coach.name} — Coaching License / Certificate`
                          )
                        }
                      >
                        <Ionicons name="document-text" size={16} color="#10B981" />
                        <Text style={styles.docInspectBtnText}>Inspect License</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.docMissingPill}>
                        <Ionicons name="alert-circle-outline" size={14} color="#64748B" />
                        <Text style={styles.docMissingText}>No License Uploaded</Text>
                      </View>
                    )}

                    {coach.id_card_url ? (
                      <TouchableOpacity
                        style={styles.docInspectBtn}
                        onPress={() =>
                          onInspectDocument(
                            coach.id_card_url!,
                            `${coach.name} — National ID Document`
                          )
                        }
                      >
                        <Ionicons name="card" size={16} color="#38BDF8" />
                        <Text style={styles.docInspectBtnText}>Inspect National ID</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.docMissingPill}>
                        <Ionicons name="alert-circle-outline" size={14} color="#64748B" />
                        <Text style={styles.docMissingText}>No ID Uploaded</Text>
                      </View>
                    )}
                  </View>

                  {/* Right: Approve / Reject Decision Buttons */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.approveBtn,
                        reviewingCoachUid === coach.uid && styles.btnDisabled,
                      ]}
                      disabled={reviewingCoachUid === coach.uid}
                      onPress={async () => {
                        await onReviewCoach(coach.uid, 'approve');
                      }}
                      activeOpacity={0.8}
                    >
                      {reviewingCoachUid === coach.uid ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-sharp" size={16} color="#000" />
                          <Text style={styles.approveBtnText}>
                            {isApproved ? 'Re-Approve' : 'Approve & Verify'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.rejectBtn,
                        reviewingCoachUid === coach.uid && styles.btnDisabled,
                      ]}
                      disabled={reviewingCoachUid === coach.uid}
                      onPress={() => {
                        setRejectModalCoach(coach);
                        setRejectionReason(coach.rejection_reason || '');
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-sharp" size={16} color="#EF4444" />
                      <Text style={styles.rejectBtnText}>
                        {isRejected ? 'Edit Reason' : 'Reject'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ── REJECTION MODAL WITH PRESETS ── */}
      <Modal
        visible={!!rejectModalCoach}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalCoach(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name="shield-outline" size={20} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Reject Coach Application</Text>
                  <Text style={styles.modalSubtitle}>{rejectModalCoach?.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setRejectModalCoach(null)}>
                <Ionicons name="close" size={22} color="#8A95A5" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionLabel}>Select Common Rejection Reason:</Text>
            <View style={styles.presetsGrid}>
              {rejectionPresets.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetChip}
                  onPress={() => setRejectionReason(preset)}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionLabel, { marginTop: 14 }]}>
              Custom Instructions for the Coach:
            </Text>
            <TextInput
              style={styles.rejectionInput}
              multiline
              numberOfLines={4}
              placeholder="Explain clearly what document needs to be re-uploaded or corrected..."
              placeholderTextColor="#64748B"
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalCoach(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                onPress={handleConfirmReject}
                disabled={isSubmittingReject}
              >
                {isSubmittingReject ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="#FFF" />
                    <Text style={styles.modalConfirmRejectBtnText}>Confirm Rejection</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  headerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pendingBadgeHeader: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingBadgeHeaderText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    maxWidth: 650,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  kpiGridMobile: {
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
  },
  kpiCardActiveOrange: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  kpiCardActiveGreen: {
    borderColor: '#00E676',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  kpiCardActiveRed: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  kpiCardActiveBlue: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  kpiCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kpiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Filter Section */
  filterSection: {
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  domainFilterRow: {
    flexDirection: 'row',
  },
  domainPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  domainPillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  domainPillText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  domainPillTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },

  /* List & Cards */
  listContainer: {
    gap: 16,
  },
  emptyState: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 400,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetFilterBtnText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Coach Card */
  coachCard: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  coachCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  coachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#334155',
  },
  coachInfoWrap: {
    flex: 1,
  },
  coachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  coachName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pendingBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  approvedBadgeText: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '700',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rejectedBadgeText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  domainTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  domainTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  affiliationText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    fontWeight: '600',
  },
  licenseNumberText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    backgroundColor: '#1E293B50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  statMiniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statMiniLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  statMiniVal: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  statMiniDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#334155',
  },

  /* Specialties */
  specialtiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  specChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  specChipText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Bio */
  bioBox: {
    backgroundColor: '#1E293B40',
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  bioText: {
    color: '#CBD5E1',
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  /* Rejection Notice */
  rejectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  rejectionNoticeText: {
    color: '#FCA5A5',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },

  /* Contact */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactChipText: {
    color: '#00E676',
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Card Footer Deck */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 14,
    flexWrap: 'wrap',
  },
  docDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  docInspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  docInspectBtnText: {
    color: '#F8FAFC',
    fontSize: 12.5,
    fontWeight: '700',
  },
  docMissingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  docMissingText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00E676',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 2,
  },
  approveBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  /* Rejection Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 20,
    maxWidth: 550,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 12.5,
  },
  modalSectionLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  presetsGrid: {
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  rejectionInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#FFFFFF',
    fontSize: 13,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  modalConfirmRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmRejectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
