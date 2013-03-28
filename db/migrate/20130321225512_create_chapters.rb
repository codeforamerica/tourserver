class CreateChapters < ActiveRecord::Migration
  def change
    create_table :chapters do |t|
      t.integer :tour_id
      t.integer :interest_point_id
      t.integer :position

      t.timestamps
    end
  end
end
