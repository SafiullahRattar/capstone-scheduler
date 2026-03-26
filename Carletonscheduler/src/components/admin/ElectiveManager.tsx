import { useState, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { API_BASE_URL } from '../../config/constants';

interface ElectiveCategory {
  name: string;
  label: string;
  selectionUnitCredits: number;
  courseCount: number;
  courses: string[];
}

export function ElectiveManager() {
  const [categories, setCategories] = useState<ElectiveCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingCourse, setAddingCourse] = useState<string | null>(null);
  const [newCourseId, setNewCourseId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New category form
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/electives`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch elective categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (categoryId: string) => {
    if (!newCourseId.trim()) {
      setError('Please enter a course ID');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/electives/${categoryId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: newCourseId.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add course');
        return;
      }

      setNewCourseId('');
      setAddingCourse(null);
      fetchCategories();
    } catch (err) {
      setError('Failed to add course');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveCourse = async (categoryId: string, courseId: string) => {
    if (!confirm(`Remove ${courseId} from this category?`)) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/electives/${categoryId}/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to remove course:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryId.trim() || !newCategoryLabel.trim()) {
      setError('Please enter both ID and label');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/electives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newCategoryId.trim(), label: newCategoryLabel.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create category');
        return;
      }

      setNewCategoryId('');
      setNewCategoryLabel('');
      setShowNewCategory(false);
      fetchCategories();
    } catch (err) {
      setError('Failed to create category');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, label: string) => {
    if (!confirm(`Delete "${label}"? This will remove all course associations.`)) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/electives/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        if (expandedCategory === categoryId) {
          setExpandedCategory(null);
        }
        fetchCategories();
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.courses.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>
          Elective Categories
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Manage which courses belong to each elective category for degree audit matching
        </p>
      </div>

      {/* Search and Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search 
            className="w-4 h-4" 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#94a3b8'
            }} 
          />
          <input
            type="text"
            placeholder="Search categories or courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowNewCategory(true)}
          style={{ fontSize: '14px' }}
        >
          New Category
        </Button>
      </div>

      {/* New Category Form */}
      {showNewCategory && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#111', marginBottom: '16px' }}>
            Create New Category
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Category ID
              </label>
              <input
                type="text"
                placeholder="e.g., TECH_ELECTIVE"
                value={newCategoryId}
                onChange={e => setNewCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Display Label
              </label>
              <input
                type="text"
                placeholder="e.g., Technical Elective"
                value={newCategoryLabel}
                onChange={e => setNewCategoryLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button onClick={handleCreateCategory} disabled={actionLoading}>
                Create
              </Button>
              <button
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryId('');
                  setNewCategoryLabel('');
                  setError(null);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#64748b',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626', marginTop: '12px' }}>{error}</p>
          )}
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <p style={{ fontSize: '14px', color: '#94a3b8', padding: '20px' }}>Loading...</p>
      ) : filteredCategories.length === 0 ? (
        <div style={{ 
          padding: '48px',
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #f1f5f9'
        }}>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {searchQuery ? 'No categories match your search' : 'No elective categories found'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredCategories.map(category => {
            const isExpanded = expandedCategory === category.name;
            const isAdding = addingCourse === category.name;

            return (
              <div
                key={category.name}
                style={{
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
                {/* Category Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: isExpanded ? '#f8fafc' : 'transparent'
                  }}
                  onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" style={{ color: '#64748b', marginRight: '12px' }} />
                  ) : (
                    <ChevronRight className="w-4 h-4" style={{ color: '#64748b', marginRight: '12px' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 500, color: '#111' }}>
                      {category.label}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      {category.name} · {category.courseCount} course{category.courseCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteCategory(category.name, category.label);
                    }}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                    title="Delete category"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f1f5f9' }}>
                    {/* Add Course */}
                    <div style={{ padding: '16px 0' }}>
                      {isAdding ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            placeholder="Course ID (e.g., SYSC4001)"
                            value={newCourseId}
                            onChange={e => setNewCourseId(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddCourse(category.name);
                              if (e.key === 'Escape') {
                                setAddingCourse(null);
                                setNewCourseId('');
                                setError(null);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              fontSize: '14px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              maxWidth: '200px'
                            }}
                            autoFocus
                          />
                          <Button 
                            onClick={() => handleAddCourse(category.name)} 
                            disabled={actionLoading}
                            style={{ padding: '8px 16px' }}
                          >
                            Add
                          </Button>
                          <button
                            onClick={() => {
                              setAddingCourse(null);
                              setNewCourseId('');
                              setError(null);
                            }}
                            style={{
                              padding: '8px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748b'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingCourse(category.name);
                            setError(null);
                          }}
                          style={{
                            fontSize: '13px',
                            color: '#bf112b',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          + Add course
                        </button>
                      )}
                      {error && addingCourse === category.name && (
                        <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>{error}</p>
                      )}
                    </div>

                    {/* Course List */}
                    {category.courses.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 0' }}>
                        No courses in this category
                      </p>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px'
                      }}>
                        {category.courses.map(courseId => (
                          <div
                            key={courseId}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              fontSize: '13px',
                              color: '#334155',
                              background: '#f1f5f9',
                              borderRadius: '6px'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace' }}>{courseId}</span>
                            <button
                              onClick={() => handleRemoveCourse(category.name, courseId)}
                              disabled={actionLoading}
                              style={{
                                padding: '2px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                              title="Remove from category"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
